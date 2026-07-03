// ========== منطق اصلی برنامه ==========

let videos = [];
let currentVideoId = null;
let currentUser = null;

// ---------- بارگذاری ویدیوها ----------
function loadVideos() {
    // دریافت ویدیوهای همه کاربران
    const users = JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
    let allVideos = [];
    
    users.forEach(user => {
        if (user.videos && user.videos.length > 0) {
            user.videos.forEach(video => {
                allVideos.push({
                    ...video,
                    uploader: user.username,
                    uploaderFullName: user.fullName || user.username
                });
            });
        }
    });
    
    videos = allVideos;
    
    if (videos.length === 0) {
        document.getElementById('emptyMessage').style.display = 'block';
        document.getElementById('videoGrid').style.display = 'none';
    } else {
        document.getElementById('emptyMessage').style.display = 'none';
        document.getElementById('videoGrid').style.display = 'grid';
        renderVideos(videos);
    }
}

// ---------- رندر ویدیوها ----------
function renderVideos(videoList) {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';
    
    if (videoList.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px;">🎥 هیچ ویدیویی با این جستجو پیدا نشد!</p>';
        return;
    }
    
    videoList.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="thumbnail">
                <span class="play-icon">▶️</span>
                ${video.thumbnail ? `<img src="${video.thumbnail}" style="width:100%;height:100%;object-fit:cover;">` : ''}
                <span class="video-duration">${video.duration || '۰۰:۰۰'}</span>
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p style="font-size:13px;color:rgba(255,255,255,0.5);">${video.uploaderFullName}</p>
                <div class="meta">
                    <span class="category-tag">${video.category || 'سایر'}</span>
                    <span>👁️ ${video.views || ۰}</span>
                </div>
            </div>
        `;
        card.addEventListener('click', () => openPlayer(video.id));
        grid.appendChild(card);
    });
}

// ---------- پخش ویدیو ----------
function openPlayer(videoId) {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    
    currentVideoId = videoId;
    
    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('videoDescription').textContent = video.description || 'بدون توضیحات';
    document.getElementById('videoUploader').textContent = `👤 آپلود کننده: ${video.uploaderFullName}`;
    document.getElementById('videoCategory').textContent = `📂 دسته: ${video.category || 'سایر'}`;
    document.getElementById('videoDate').textContent = `📅 تاریخ: ${new Date(video.uploadDate).toLocaleDateString('fa-IR')}`;
    document.getElementById('videoViews').textContent = `👁️ بازدید: ${video.views || ۰}`;
    document.getElementById('likeCount').textContent = video.likes || ۰;
    
    // بررسی اینکه کاربر قبلاً لایک کرده یا نه
    const currentUser = getCurrentUser();
    if (currentUser) {
        const fullUser = getFullUser();
        if (fullUser && fullUser.likedVideos && fullUser.likedVideos.includes(videoId)) {
            document.querySelector('.like-btn').classList.add('liked');
        } else {
            document.querySelector('.like-btn').classList.remove('liked');
        }
    }
    
    // تنظیم ویدیو (از داده‌های ذخیره شده یا نمونه)
    const videoSource = document.getElementById('videoSource');
    if (video.videoData) {
        // اگر ویدیو به صورت Base64 ذخیره شده (برای دمو)
        videoSource.src = video.videoData;
    } else {
        // ویدیوی نمونه برای تست
        videoSource.src = 'https://www.w3schools.com/html/mov_bbb.mp4';
    }
    
    document.getElementById('videoPlayer').load();
    document.getElementById('playerPanel').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // افزایش بازدید
    incrementView(videoId);
    document.getElementById('videoPlayer').play();
}

// ---------- افزایش بازدید ----------
function incrementView(videoId) {
    const users = JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
    let updated = false;
    
    users.forEach(user => {
        if (user.videos) {
            user.videos.forEach(video => {
                if (video.id === videoId) {
                    video.views = (video.views || ۰) + 1;
                    updated = true;
                }
            });
        }
    });
    
    if (updated) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(users));
        // بروزرسانی نمایش
        loadVideos();
    }
}

// ---------- بستن پخش‌کننده ----------
function closePlayer() {
    document.getElementById('playerPanel').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('videoPlayer').pause();
}

// ---------- لایک کردن ----------
function likeVideo() {
    if (!currentVideoId) return;
    
    const session = getCurrentUser();
    if (!session) {
        alert('⚠️ برای لایک کردن باید وارد حساب خود شوید!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
    const userIndex = users.findIndex(u => u.id === session.userId);
    if (userIndex === -1) return;
    
    const user = users[userIndex];
    if (!user.likedVideos) user.likedVideos = [];
    
    const alreadyLiked = user.likedVideos.includes(currentVideoId);
    const likeBtn = document.querySelector('.like-btn');
    
    // پیدا کردن ویدیو در تمام کاربران
    let videoFound = false;
    users.forEach(u => {
        if (u.videos) {
            u.videos.forEach(v => {
                if (v.id === currentVideoId) {
                    if (!alreadyLiked) {
                        v.likes = (v.likes || ۰) + 1;
                        user.likedVideos.push(currentVideoId);
                        likeBtn.classList.add('liked');
                        videoFound = true;
                    } else {
                        v.likes = Math.max((v.likes || ۰) - 1, 0);
                        user.likedVideos = user.likedVideos.filter(id => id !== currentVideoId);
                        likeBtn.classList.remove('liked');
                        videoFound = true;
                    }
                }
            });
        }
    });
    
    if (videoFound) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(users));
        // بروزرسانی نمایش لایک
        const video = videos.find(v => v.id === currentVideoId);
        if (video) {
            document.getElementById('likeCount').textContent = video.likes || ۰;
            // بروزرسانی در لیست اصلی
            loadVideos();
        }
    }
}

// ---------- جستجو و فیلتر ----------
function filterVideos() {
    const searchText = document.getElementById('searchInput').value.trim().toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    
    const filtered = videos.filter(video => {
        const matchSearch = video.title.includes(searchText) ||
                           (video.description && video.description.includes(searchText)) ||
                           video.uploaderFullName.includes(searchText);
        const matchCategory = category === 'all' || video.category === category;
        return matchSearch && matchCategory;
    });
    
    renderVideos(filtered);
}

// رویدادهای جستجو
if (document.getElementById('searchInput')) {
    document.getElementById('searchInput').addEventListener('input', filterVideos);
    document.getElementById('categoryFilter').addEventListener('change', filterVideos);
}

// ---------- بارگذاری اولیه ----------
if (document.getElementById('videoGrid')) {
    loadVideos();
    updateUserStatus();
}
