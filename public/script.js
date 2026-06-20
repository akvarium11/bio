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
    const bgAudio = document.getElementById('bg-audio');
    const playBtn = document.getElementById('play-btn');
    const playIcon = playBtn.querySelector('i');

    let isPlaying = false;

    overlay.addEventListener('click', () => {
        overlay.classList.add('hidden');
        mainContainer.classList.add('visible');

        // Start audio
        bgAudio.play().then(() => {
            isPlaying = true;
            playIcon.classList.remove('fa-play');
            playIcon.classList.add('fa-pause');
        }).catch(err => console.error("Audio playback failed:", err));
    });

    // 3. Audio Player Controls (Playlist, Shuffle, Loop)
    const progressSlider = document.getElementById('progress-slider');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');

    // New controls and elements
    const trackCover = document.getElementById('track-cover');
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
            title: "Toromi hearts 2", // То, что будет написано в плеере
            src: "/assets/songs/goreshit - toromi hearts 2.mp3", // Путь к локальному файлу
            cover: "https://r2.fakecrime.bio/tracks/covers/b266f5e7-b578-42ee-a159-3e17a75a5250.jpg", // Ссылка на обложку (или локальный путь /assets/cover1.jpg)
            url: "https://soundcloud.com/goreshit/toromi-hearts-2" // Ссылка, которая откроется при клике на название
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
            title: "Miss The Rage (Sewerslvt Remix)",
            src: "/assets/songs/Mario Judah, Sewerslvt - Miss The Rage (Sewerslvt Remix).mp3",
            cover: "https://i1.sndcdn.com/artworks-VrjfqQqDnSsa5abn-zUaPeg-t500x500.jpg",
            url: "https://soundcloud.com/swrslt-rare-music-archive/mario-judah-miss-the-rage"
        }
    ];

    let currentTrackIndex = 0;
    let isShuffle = false;
    let isLoop = false;

    // Инициализация первой песни
    loadTrack(0);

    function loadTrack(index) {
        if (tracks.length === 0) return;
        const track = tracks[index];
        bgAudio.src = track.src;
        trackCover.src = track.cover;
        trackTitle.textContent = track.title;
        trackLink.href = track.url;
        if (isPlaying) {
            bgAudio.play();
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
        loadTrack(currentTrackIndex);
    }

    function playPrevTrack() {
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadTrack(currentTrackIndex);
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
            bgAudio.play();
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
        if (isPlaying) {
            bgAudio.pause();
            playIcon.className = 'fa-solid fa-play';
        } else {
            bgAudio.play();
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
        { name: "SoundCloud", link: "https://soundcloud.com/akvarium11/", icon: "fa-brands fa-soundcloud" }
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

    // 5. 3D Tilt Effect on Bio Card (Desktop Only)
    const bioCard = document.querySelector('.bio-card');
    document.addEventListener('mousemove', (e) => {
        if (window.innerWidth <= 768) return;
        bioCard.style.transition = 'transform 0.1s ease-out';
        const xAxis = (window.innerWidth / 2 - e.pageX) / 40;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 40;
        bioCard.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });

    // Reset when mouse leaves window
    document.addEventListener('mouseleave', () => {
        if (window.innerWidth <= 768) return;
        bioCard.style.transition = 'transform 1.2s ease-out';
        bioCard.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg)`;
    });

    // Initialize is handled at the top of the script
});
