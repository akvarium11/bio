document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. НАСТРОЙКИ ПРОФИЛЯ
    // ==========================================
    const profileConfig = {
        username: "akvarium",
        bio: "<b>shitty C++ dev</b>",
        location: "Russia, Gore",
        avatar: "/assets/avatars/avatar.webp", // Путь к вашей аватарке (закиньте файл в assets/avatars/)
        avatarEars: "/assets/decorations/cat-ears.gif" // Путь к украшению (закиньте файл в assets/decorations/). Оставьте "", если не нужно
    };

    // ==========================================
    // 1.1 СЕКЦИЯ КОММЕНТАРИЕВ
    // ==========================================
    let currentCommentsPage = 1;
    const commentsLimit = 5;

    // Применение настроек профиля
    document.getElementById('profile-username').innerHTML = profileConfig.username;
    document.getElementById('profile-bio').innerHTML = profileConfig.bio;

    if (profileConfig.location) {
        document.getElementById('profile-location').innerHTML = profileConfig.location;
    } else {
        document.getElementById('profile-location-container').style.display = 'none';
    }

    document.getElementById('profile-avatar').src = profileConfig.avatar;

    // Set Favicon
    let favicon = document.querySelector("link[rel~='icon']");
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
    }
    favicon.href = profileConfig.avatar;

    const earsEl = document.getElementById('profile-ears');
    if (profileConfig.avatarEars) {
        earsEl.src = profileConfig.avatarEars;
    } else {
        earsEl.style.display = 'none';
    }

    const commentsListContainer = document.getElementById('comments-list');
    const commentsPaginationContainer = document.getElementById('comments-pagination');
    const commentForm = document.getElementById('comment-form');
    const commentMessage = document.getElementById('comment-message');

    // Helper to format date nicely
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин. назад`;
        if (diffHours < 24) return `${diffHours} ч. назад`;

        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Load comments function
    async function loadComments(page = 1) {
        if (!commentsListContainer) return;

        try {
            const response = await fetch(`/api/comments?page=${page}&limit=${commentsLimit}`);
            if (!response.ok) throw new Error('Ошибка сети при загрузке комментариев');

            const data = await response.json();

            // Render comments
            commentsListContainer.innerHTML = '';

            if (data.comments.length === 0) {
                commentsListContainer.innerHTML = `<div style="text-align: center; color: rgba(255,255,255,0.3); font-size: 0.85rem; padding: 20px;">Пока нет комментариев. Будьте первыми!</div>`;
            } else {
                data.comments.forEach(comment => {
                    const item = document.createElement('div');
                    item.className = 'comment-item';

                    const header = document.createElement('div');
                    header.className = 'comment-header';

                    const author = document.createElement('span');
                    author.className = 'comment-author';
                    author.textContent = comment.name;

                    const date = document.createElement('span');
                    date.className = 'comment-date';
                    date.textContent = formatDate(comment.timestamp);

                    header.appendChild(author);
                    header.appendChild(date);

                    const text = document.createElement('div');
                    text.className = 'comment-text';
                    text.textContent = comment.text;

                    item.appendChild(header);
                    item.appendChild(text);
                    commentsListContainer.appendChild(item);
                });
            }

            // Update page state and render pagination
            currentCommentsPage = data.currentPage;
            renderPagination(data.currentPage, data.totalPages);

        } catch (error) {
            console.error('Error fetching comments:', error);
            commentsListContainer.innerHTML = `<div style="text-align: center; color: #ff4757; font-size: 0.85rem; padding: 20px;">Не удалось загрузить комментарии.</div>`;
        }
    }

    // Render pagination: < page_num >
    function renderPagination(currentPage, totalPages) {
        if (!commentsPaginationContainer) return;
        commentsPaginationContainer.innerHTML = '';

        // If only 1 page, we can hide pagination or show it disabled.
        // Let's always show it for consistency and style, but disable arrows.
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-nav-btn';
        prevBtn.innerHTML = '&lt;';
        prevBtn.disabled = currentPage <= 1;
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentPage > 1) {
                loadComments(currentPage - 1);
            }
        });

        const pageSpan = document.createElement('span');
        pageSpan.className = 'current-page-num';
        pageSpan.textContent = currentPage;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-nav-btn';
        nextBtn.innerHTML = '&gt;';
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentPage < totalPages) {
                loadComments(currentPage + 1);
            }
        });

        commentsPaginationContainer.appendChild(prevBtn);
        commentsPaginationContainer.appendChild(pageSpan);
        commentsPaginationContainer.appendChild(nextBtn);
    }

    // Submit new comment form listener
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('comment-name');
            const textInput = document.getElementById('comment-text');
            const submitBtn = document.getElementById('comment-submit-btn');

            if (!nameInput || !textInput || !submitBtn) return;

            const name = nameInput.value.trim();
            const text = textInput.value.trim();

            if (!name || !text) return;

            // Disable submit button
            submitBtn.disabled = true;
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Отправка...';

            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, text })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Произошла ошибка при отправке');
                }

                // Show success message
                showMessage(data.message || 'Комментарий добавлен!', 'success');

                // Clear textarea, keep name for convenience
                textInput.value = '';

                // Reload first page to show latest comments
                await loadComments(1);

            } catch (error) {
                console.error('Error posting comment:', error);
                showMessage(error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    // Message notification helper
    let messageTimeout;
    function showMessage(msg, type) {
        if (!commentMessage) return;

        clearTimeout(messageTimeout);
        commentMessage.textContent = msg;
        commentMessage.className = `comment-message ${type}`;
        commentMessage.classList.remove('hidden');

        messageTimeout = setTimeout(() => {
            commentMessage.classList.add('hidden');
        }, 5000);
    }

    // Initial comments fetch
    loadComments(1);

    // ==========================================
    // 2. Анимация Снежинок
    // ==========================================
    const snowContainer = document.getElementById('snow-container');
    const snowflakeCount = 30;

    for (let i = 0; i < snowflakeCount; i++) {
        createSnowflake();
    }

    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');

        // Randomize properties
        const startLeft = Math.random() * 100; // 0 to 100vw
        const animationDuration = 5 + Math.random() * 10; // 5s to 15s
        const animationDelay = Math.random() * 5; // 0 to 5s delay

        // Randomize particle size and blur
        const size = Math.random() * 6 + 4; // 4px to 10px
        const blurAmount = Math.random() * 3 + 1; // 1px to 4px
        const opacity = Math.random() * 0.5 + 0.3; // 0.3 to 0.8

        snowflake.style.left = `${startLeft}vw`;
        snowflake.style.animationDuration = `${animationDuration}s`;
        snowflake.style.animationDelay = `${animationDelay}s`;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        snowflake.style.filter = `blur(${blurAmount}px)`;
        snowflake.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
        snowflake.style.opacity = opacity;
        snowflake.style.fontSize = `${size}em`;

        snowContainer.appendChild(snowflake);

        // Remove and recreate when animation ends to keep it infinite without buildup
        snowflake.addEventListener('animationend', () => {
            snowflake.remove();
            createSnowflake();
        });
    }

    // 2. Overlay & Audio
    const overlay = document.getElementById('click-overlay');
    const mainContainer = document.querySelector('.main-container');
    const islandContainer = document.querySelector('.dynamic-island-container');
    const bgAudio = document.getElementById('bg-audio');
    const playBtn = document.getElementById('play-btn');
    const playIcon = playBtn.querySelector('i');
    let trackCover = document.getElementById('track-cover');
    let currentCoverWrapper = document.getElementById('current-cover-wrapper');
    const coversContainer = document.querySelector('.covers-container');

    let isPlaying = false;
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let sourceNode = null;

    function initAudioContext() {
        if (audioContext) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 64; // 32 frequency bins

            sourceNode = audioContext.createMediaElementSource(bgAudio);
            sourceNode.connect(analyser);
            analyser.connect(audioContext.destination);

            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        } catch (e) {
            console.error("Web Audio API blocked or not supported:", e);
        }
    }

    // Synchronize play state animations between compact and expanded view covers
    function setCoverAnimationState(playing) {
        const miniCover = document.getElementById('mini-cover');
        const miniWaveform = document.getElementById('mini-waveform');
        
        if (playing) {
            if (trackCover) {
                trackCover.classList.add('spinning');
                trackCover.classList.remove('paused');
            }
            if (miniCover) {
                miniCover.classList.add('spinning');
                miniCover.classList.remove('paused');
            }
            if (miniWaveform) {
                miniWaveform.classList.add('playing');
            }
        } else {
            if (trackCover) {
                trackCover.classList.add('paused');
            }
            if (miniCover) {
                miniCover.classList.add('paused');
            }
            if (miniWaveform) {
                miniWaveform.classList.remove('playing');
            }
        }
    }

    overlay.addEventListener('click', () => {
        const clickText = document.getElementById('click-text');
        if (clickText && clickText.classList.contains('hidden')) {
            return;
        }

        overlay.classList.add('hidden');
        mainContainer.classList.add('visible');
        if (islandContainer) {
            islandContainer.classList.add('visible');
        }

        initAudioContext();
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }

        // Start audio
        bgAudio.play().then(() => {
            isPlaying = true;
            playIcon.classList.remove('fa-play');
            playIcon.classList.add('fa-pause');
            setCoverAnimationState(true);
        }).catch(err => console.error("Audio playback failed:", err));
    });

    // 3. Audio Player Controls (Playlist, Shuffle, Loop)
    const progressSlider = document.getElementById('progress-slider');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');

    // New controls and elements
    const trackTitle = document.getElementById('track-title');
    const trackLink = document.getElementById('track-link');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const loopBtn = document.getElementById('loop-btn');

    const volumeSlider = document.getElementById('volume-slider');
    const muteBtn = document.getElementById('mute-btn');
    const muteIcon = muteBtn.querySelector('i');

    // Playlist data
    // Впишите сюда информацию о ваших песнях. 
    // Убедитесь, что файлы лежат в папке u:\web\bio\assets\songs\
    const tracks = [
        {
            title: "Toromi hearts 2", 
            src: "/assets/songs/goreshit - toromi hearts 2.mp3",  
            cover: "assets/cover.jpg", 
            url: "https://soundcloud.com/goreshit/toromi-hearts-2"
        },
        {
            title: "pirupi", 
            src: "/assets/songs/goreshit - pirupi.mp3",  
            cover: "https://i1.sndcdn.com/artworks-000474923970-8g1bij-t500x500.jpg", 
            url: "https://soundcloud.com/goreshit/pirupi"
        },
        {
            title: "Spreading excitement all over the world!", 
            src: "/assets/songs/psiangel - Spreading excitement all over the world!.mp3",  
            cover: "https://i1.sndcdn.com/artworks-q93aKZfQTktFzHAZ-IMRcBw-t500x500.jpg", 
            url: "https://soundcloud.com/psiangel/god-knows"
        },
        {
            title: "Illusionary Night [Fuwa Fuwa Spring Storm]", // То, что будет написано в плеере
            src: "assets/songs/ELECTR, Fuwa Fuwa Spring Storm - Illusionary Night.mp3", // Путь к локальному файлу
            cover: "https://i1.sndcdn.com/artworks-1ZyMjlvONjI9vzw0-0MBvuw-t500x500.jpg", // Ссылка на обложку (или локальный путь /assets/cover1.jpg)
            url: "https://soundcloud.com/electr-nics/illusionary-night" // Ссылка, которая откроется при клике на название
        },
        {
            title: "Miss The Rage (Sewerslvt Remix)",
            src: "/assets/songs/Mario Judah, Sewerslvt - Miss The Rage (Sewerslvt Remix).mp3",
            cover: "https://i1.sndcdn.com/artworks-VrjfqQqDnSsa5abn-zUaPeg-t500x500.jpg",
            url: "https://soundcloud.com/swrslt-rare-music-archive/mario-judah-miss-the-rage"
        },
                {
            title: "Hi High (Sewerslvt Remix)",
            src: "/assets/songs/LOONA, Sewerslvt - Hi High (Sewerslvt Remix).mp3",
            cover: "https://i1.sndcdn.com/artworks-EfIFAzBOnKHZ7KZU-SPdcKg-t500x500.jpg",
            url: "https://soundcloud.com/sewerslvt/loona-hi-high-sewerslvt-remix"
        },
        {
            title: "The fastest Love Song",
            src: "/assets/songs/The fastest Love Song.mp3",
            cover: "https://i1.sndcdn.com/artworks-XM2EGiGof0rQyMRe-1mIc0w-t500x500.jpg",
            url: "https://soundcloud.com/sunset-381187614/videoplayback"
        },
        {
            title: "im gonna die (Shoebill remix)",
            src: "/assets/songs/Kitty On Fire Records, Shoebill - im gonna die (Shoebill Remix).mp3",
            cover: "https://i1.sndcdn.com/artworks-rWi6fHX40C3J7R1A-GhyYgA-t500x500.jpg",
            url: "https://soundcloud.com/kitty-on-fire-records/im-gonna-die-shoebill-remix"
        },
        {
            title: "fresh meat (remix of diet tea other cola)",
            src: "/assets/songs/Kitty On Fire Records, remix of diet tea other cola - fresh meat.mp3",
            cover: "https://i1.sndcdn.com/artworks-rWi6fHX40C3J7R1A-GhyYgA-t500x500.jpg",
            url: "https://soundcloud.com/kitty-on-fire-records/fresh-meat-remix-of-diet-tea"
        }
    ];

    let currentTrackIndex = 0;
    let isShuffle = false;
    let isLoop = false;

    // Инициализация первой песни
    loadTrack(0);

    function loadTrack(index, animateDirection = 0) {
        if (tracks.length === 0) return;
        const track = tracks[index];
        bgAudio.src = track.src;
        trackTitle.textContent = track.title;
        trackLink.href = track.url;

        // Also update compact elements
        const miniCover = document.getElementById('mini-cover');
        const miniTrackTitle = document.getElementById('mini-track-title');
        if (miniCover) miniCover.src = track.cover;
        if (miniTrackTitle) miniTrackTitle.textContent = track.title;

        if (animateDirection !== 0 && coversContainer) {
            const newWrapper = document.createElement('div');
            newWrapper.className = 'cover-wrapper';
            newWrapper.style.transform = `translateX(${animateDirection * 100}px)`;
            newWrapper.style.opacity = '0';

            const newImg = document.createElement('img');
            newImg.src = track.cover;
            newImg.alt = 'Track Cover';
            newImg.className = 'track-cover';
            newImg.id = 'track-cover';
            
            newWrapper.appendChild(newImg);
            coversContainer.appendChild(newWrapper);

            if (currentCoverWrapper) {
                const oldWrapper = currentCoverWrapper;
                const oldImg = oldWrapper.querySelector('.track-cover');
                if (oldImg) oldImg.removeAttribute('id');
                
                oldWrapper.style.transform = `translateX(${-animateDirection * 100}px)`;
                oldWrapper.style.opacity = '0';
                setTimeout(() => {
                    if (oldWrapper.parentNode) oldWrapper.parentNode.removeChild(oldWrapper);
                }, 500);
            }

            void newWrapper.offsetWidth; // trigger reflow
            newWrapper.style.transform = 'translateX(0)';
            newWrapper.style.opacity = '1';

            currentCoverWrapper = newWrapper;
            trackCover = newImg;
        } else {
            trackCover.src = track.cover;
        }

        if (isPlaying) {
            bgAudio.play().then(() => {
                setCoverAnimationState(true);
            }).catch(e => console.log(e));
        } else {
            setCoverAnimationState(false);
        }
    }

    function playNextTrack() {
        if (isShuffle) {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * tracks.length);
            } while (newIndex === currentTrackIndex && tracks.length > 1);
            currentTrackIndex = newIndex;
        } else {
            currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        }
        loadTrack(currentTrackIndex, 1);
    }

    function playPrevTrack() {
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadTrack(currentTrackIndex, -1);
    }

    nextBtn.addEventListener('click', playNextTrack);
    prevBtn.addEventListener('click', playPrevTrack);

    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
    });

    loopBtn.addEventListener('click', () => {
        isLoop = !isLoop;
        loopBtn.classList.toggle('active', isLoop);
    });

    // Volume Controls
    let lastVolume = 1;

    function setVolume(val) {
        bgAudio.volume = val;
        volumeSlider.value = val;
        volumeSlider.style.setProperty('--value', `${val * 100}%`);
        localStorage.setItem('bio_volume', val);

        if (val === 0) {
            muteIcon.className = 'fa-solid fa-volume-xmark fa-fw';
        } else if (val <= 0.33) {
            muteIcon.className = 'fa-solid fa-volume-off fa-fw';
        } else if (val <= 0.66) {
            muteIcon.className = 'fa-solid fa-volume-low fa-fw';
        } else {
            muteIcon.className = 'fa-solid fa-volume-high fa-fw';
        }
    }

    // Load saved volume
    const savedVolume = localStorage.getItem('bio_volume');
    if (savedVolume !== null) {
        setVolume(parseFloat(savedVolume));
    } else {
        setVolume(0.5); // Default 50% volume
    }

    volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
    });

    muteBtn.addEventListener('click', () => {
        if (bgAudio.volume > 0) {
            lastVolume = bgAudio.volume;
            setVolume(0);
        } else {
            setVolume(lastVolume || 0.5);
        }
    });

    bgAudio.addEventListener('ended', () => {
        if (isLoop) {
            bgAudio.currentTime = 0;
            bgAudio.play().then(() => {
                setCoverAnimationState(true);
            }).catch(e => console.log(e));
        } else {
            playNextTrack();
            // Need to explicitly call play if not looping but auto-advancing
            bgAudio.play().catch(e => console.log(e));
        }
    });

    function formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    bgAudio.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = formatTime(bgAudio.duration);
    });

    bgAudio.addEventListener('timeupdate', () => {
        const current = bgAudio.currentTime;
        const duration = bgAudio.duration;
        currentTimeEl.textContent = formatTime(current);

        if (duration > 0) {
            const percent = (current / duration) * 100;
            progressSlider.value = percent;
            progressSlider.style.setProperty('--value', `${percent}%`);
        }
    });

    // Sync total time when metadata is loaded
    bgAudio.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = formatTime(bgAudio.duration);
    });

    // Seek track
    progressSlider.addEventListener('input', (e) => {
        const percent = parseFloat(e.target.value);
        bgAudio.currentTime = (percent / 100) * bgAudio.duration;
        progressSlider.style.setProperty('--value', `${percent}%`);
    });

    playBtn.addEventListener('click', () => {
        initAudioContext();
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (isPlaying) {
            bgAudio.pause();
            playIcon.className = 'fa-solid fa-play';
            setCoverAnimationState(false);
        } else {
            bgAudio.play().then(() => {
                setCoverAnimationState(true);
            }).catch(e => console.log(e));
            playIcon.className = 'fa-solid fa-pause';
        }
        isPlaying = !isPlaying;
    });

    // 4. Fetch and render social links
    const socialLinksContainer = document.getElementById('social-links-container');

    function isUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function createSocialIcon(platform, linkData, iconClass) {
        if (!linkData) return;

        const a = document.createElement('a');
        a.className = 'social-icon group';

        const i = document.createElement('i');
        i.className = iconClass;

        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = platform;

        a.appendChild(i);
        a.appendChild(tooltip);

        if (isUrl(linkData)) {
            a.href = linkData;
            a.target = '_blank';
        } else {
            a.href = '#';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(linkData).then(() => {
                    tooltip.textContent = 'Copied!';
                    setTimeout(() => {
                        tooltip.textContent = platform;
                    }, 2000);
                });
            });
        }

        socialLinksContainer.appendChild(a);
    }

    // Social Links Data
    // Вы можете добавлять любые свои соцсети. 
    // Названия иконок (icon) можно найти на сайте fontawesome.com
    // Если link не начинается с http, текст будет просто копироваться по клику (как Discord)
    const socialLinks = [
        { name: "GitHub", link: "https://github.com/akvarium11", icon: "fa-brands fa-github" },
        { name: "Discord", link: "boqc", icon: "fa-brands fa-discord" },
        { name: "Steam", link: "https://steamcommunity.com/id/akvarium11/", icon: "fa-brands fa-steam" },
        { name: "SoundCloud", link: "https://soundcloud.com/akvarium11/", icon: "fa-brands fa-soundcloud" },
        { name: "NameMC", link: "https://namemc.com/profile/akkvarium", icon: "fa-brands fa-microsoft" }
        // Примеры других соцсетей (раскомментируйте или измените):
        // { name: "Telegram", link: "https://t.me/fakecrime", icon: "fa-brands fa-telegram" },
        // { name: "SoundCloud", link: "https://soundcloud.com/fakecrime", icon: "fa-brands fa-soundcloud" },
        // { name: "Spotify", link: "https://spotify.com/", icon: "fa-brands fa-spotify" },
        // { name: "Instagram", link: "https://instagram.com/", icon: "fa-brands fa-instagram" },
        // { name: "VK", link: "https://vk.com/", icon: "fa-brands fa-vk" }
    ];

    socialLinks.forEach(social => {
        createSocialIcon(social.name, social.link, social.icon);
    });

    // 5. 3D Tilt Effect on Active Card & Mouse Shine Tracking
    document.addEventListener('mousemove', (e) => {
        const activeCard = document.querySelector('.tab-card.active');
        if (!activeCard) return;

        const rect = activeCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        activeCard.style.setProperty('--mouse-x', `${x}px`);
        activeCard.style.setProperty('--mouse-y', `${y}px`);

        if (window.innerWidth <= 768) return;
        
        // Reset transform on non-active cards to prevent issues
        document.querySelectorAll('.tab-card:not(.active)').forEach(c => {
            c.style.transform = '';
        });

        activeCard.style.transition = 'transform 0.1s ease-out';
        const xAxis = (window.innerWidth / 2 - e.clientX) / 40;
        const yAxis = (window.innerHeight / 2 - e.clientY) / 40;
        activeCard.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });

    // Reset when mouse leaves window
    document.addEventListener('mouseleave', () => {
        if (window.innerWidth <= 768) return;
        document.querySelectorAll('.tab-card').forEach(card => {
            card.style.transition = 'transform 1.2s ease-out';
            if (card.classList.contains('active')) {
                card.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg)`;
            } else {
                card.style.transform = '';
            }
        });
    });

    // 6. Квадратный и белый аудиовизуализатор
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth * window.devicePixelRatio;
        canvas.height = canvas.parentElement.clientHeight * window.devicePixelRatio;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const barCount = 32;
    const bars = [];
    for (let i = 0; i < barCount; i++) {
        bars.push({
            currentHeight: 1,
            targetHeight: 1,
            speed: 0.12 + Math.random() * 0.08
        });
    }

    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const w = canvas.width;
        const h = canvas.height;
        const barWidth = (w / barCount) * 0.7;
        const gap = (w / barCount) * 0.3;

        let hasRealData = false;
        if (isPlaying && analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            if (sum > 0) {
                hasRealData = true;
            }
        }

        for (let i = 0; i < barCount; i++) {
            const bar = bars[i];

            if (isPlaying) {
                if (hasRealData) {
                    const val = dataArray[i] || 0;
                    let frequencyBoost = 1.0;
                    if (i > 16) frequencyBoost = 1.3;
                    if (i > 24) frequencyBoost = 1.6;
                    bar.targetHeight = Math.max(1, (val / 255) * h * 1.15 * frequencyBoost);
                } else {
                    const time = Date.now() * 0.0035;
                    const wave1 = Math.sin(time + i * 0.35) * 0.45 + 0.55;
                    const wave2 = Math.cos(time * 0.65 - i * 0.4) * 0.35 + 0.45;
                    const randomNoise = Math.random() * 0.2;

                    let freqMultiplier = 0.85;
                    if (i < 6) freqMultiplier = 0.45 + i * 0.08; // Bass
                    else if (i > 25) freqMultiplier = 1.0 - (i - 25) * 0.1; // Highs

                    const factor = (wave1 * 0.65 + wave2 * 0.35 + randomNoise * 0.1) * freqMultiplier;
                    bar.targetHeight = Math.max(1, factor * h * 0.95);
                }
            } else {
                bar.targetHeight = 1;
            }

            bar.currentHeight += (bar.targetHeight - bar.currentHeight) * bar.speed;

            const x = i * (barWidth + gap) + gap / 2;
            const y = h - bar.currentHeight;

            ctx.fillStyle = '#ffffff'; // Полностью белый

            ctx.beginPath();
            ctx.rect(x, y, barWidth, bar.currentHeight); // Квадратные столбцы
            ctx.fill();
        }
    }
    drawVisualizer();

    // ==========================================
    // 7. PRELOADER
    // ==========================================
    const preloaderContainer = document.getElementById('preloader-container');
    const progressBar = document.getElementById('progress-bar');
    const clickText = document.getElementById('click-text');

    const assetsToLoad = [];
    if (profileConfig.avatar) assetsToLoad.push(profileConfig.avatar);
    if (profileConfig.avatarEars) assetsToLoad.push(profileConfig.avatarEars);
    tracks.forEach(t => {
        if (t.cover) assetsToLoad.push(t.cover);
    });
    // Project images preloading removed (projects replaced with comments)
    // Добавим белый блеск с заднего фона
    assetsToLoad.push('assets/white.gif');

    let loadedCount = 0;

    function updateProgress() {
        loadedCount++;
        const percent = (loadedCount / assetsToLoad.length) * 100;
        progressBar.style.width = `${percent}%`;

        if (loadedCount === assetsToLoad.length) {
            setTimeout(() => {
                preloaderContainer.classList.add('hidden');
                setTimeout(() => {
                    clickText.classList.remove('hidden');
                }, 500); // Ждем пока исчезнет preloader
            }, 500); // Небольшая задержка после 100%
        }
    }

    if (assetsToLoad.length === 0) {
        if (preloaderContainer) preloaderContainer.classList.add('hidden');
        if (clickText) clickText.classList.remove('hidden');
    } else {
        assetsToLoad.forEach(src => {
            const img = new Image();
            img.onload = updateProgress;
            img.onerror = updateProgress;
            img.src = src;
        });
    }

    // ==========================================
    // 8. DYNAMIC ISLAND INTERACTIVITY
    // ==========================================
    const dynamicIsland = document.getElementById('dynamic-island');
    const islandExpanded = document.querySelector('.island-expanded');

    if (dynamicIsland) {
        // Prevent click events inside the expanded player from collapsing it
        if (islandExpanded) {
            islandExpanded.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Hover events for Desktop
        dynamicIsland.addEventListener('mouseenter', () => {
            if (window.innerWidth > 768) {
                dynamicIsland.classList.add('expanded');
            }
        });

        dynamicIsland.addEventListener('mouseleave', () => {
            if (window.innerWidth > 768) {
                if (!dynamicIsland.classList.contains('locked')) {
                    dynamicIsland.classList.remove('expanded');
                }
            }
        });

        // Click / Tap events for Mobile & Desktop locking
        dynamicIsland.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!dynamicIsland.classList.contains('expanded')) {
                dynamicIsland.classList.add('expanded');
                dynamicIsland.classList.add('locked');
            } else {
                // If it's already expanded and the user clicked outside controls (the pill background)
                // we can toggle it back to collapsed
                dynamicIsland.classList.remove('expanded');
                dynamicIsland.classList.remove('locked');
            }
        });

        // Collapse when clicking anywhere else on the screen
        document.addEventListener('click', (e) => {
            if (dynamicIsland.classList.contains('expanded')) {
                dynamicIsland.classList.remove('expanded');
                dynamicIsland.classList.remove('locked');
            }
        });
    }

    // ==========================================
    // 9. TAB SWITCHING (BIO & COMMENTS CARDS)
    // ==========================================
    let currentTab = 0;
    const tabCards = document.querySelectorAll('.tab-card');
    const navLeft = document.getElementById('nav-left');
    const navRight = document.getElementById('nav-right');

    function updateTabs() {
        tabCards.forEach((card, idx) => {
            card.classList.remove('active', 'slide-prev', 'slide-next');
            if (idx === currentTab) {
                card.classList.add('active');
            } else if (idx < currentTab) {
                card.classList.add('slide-prev');
            } else {
                card.classList.add('slide-next');
            }
            // Clear active transforms on tab switch
            card.style.transform = '';
        });

        // Update arrows visibility based on the current tab
        if (tabCards.length <= 1) {
            if (navLeft) navLeft.classList.add('hidden');
            if (navRight) navRight.classList.add('hidden');
        } else if (currentTab === 0) {
            if (navLeft) navLeft.classList.add('hidden');
            if (navRight) navRight.classList.remove('hidden');
        } else if (currentTab === tabCards.length - 1) {
            if (navLeft) navLeft.classList.remove('hidden');
            if (navRight) navRight.classList.add('hidden');
        } else {
            if (navLeft) navLeft.classList.remove('hidden');
            if (navRight) navRight.classList.remove('hidden');
        }
    }

    // Click events for navigation arrows
    if (navLeft) {
        navLeft.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentTab > 0) {
                currentTab--;
                updateTabs();
            }
        });
    }

    if (navRight) {
        navRight.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentTab < tabCards.length - 1) {
                currentTab++;
                updateTabs();
            }
        });
    }

    // Touch Swipe gestures for Mobile Devices
    let touchStartX = 0;
    let touchEndX = 0;
    const sliderContainer = document.getElementById('cards-slider');

    if (sliderContainer) {
        sliderContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        sliderContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        const swipeThreshold = 55; // minimum swipe distance in pixels
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe Left -> Next Tab
            if (currentTab < tabCards.length - 1) {
                currentTab++;
                updateTabs();
            }
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe Right -> Previous Tab
            if (currentTab > 0) {
                currentTab--;
                updateTabs();
            }
        }
    }

    // Keyboard navigation (optional, but premium experience)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            if (currentTab > 0) {
                currentTab--;
                updateTabs();
            }
        } else if (e.key === 'ArrowRight') {
            if (currentTab < tabCards.length - 1) {
                currentTab++;
                updateTabs();
            }
        }
    });

    // Initialize state
    updateTabs();
});
