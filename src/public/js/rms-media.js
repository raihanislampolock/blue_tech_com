document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    // ============================================================
    // ELEMENTS FROM PUG
    // ============================================================

    const mediaVideo =
        document.getElementById("mediaVideo");

    const mediaAudio =
        document.getElementById("mediaAudio");

    const artworkContent =
        document.getElementById("artworkContent");

    const artwork =
        document.getElementById("mediaArtwork");

    const artworkIcon =
        document.getElementById("artworkIcon");

    const miniArtworkIcon =
        document.getElementById("miniArtworkIcon");


    // ============================================================
    // PLAY BUTTONS
    // ============================================================

    const playPauseBtn =
        document.getElementById("playPauseBtn");

    const playPauseIcon =
        document.getElementById("playPauseIcon");

    const miniPlayPauseBtn =
        document.getElementById("miniPlayPauseBtn");

    const miniPlayIcon =
        document.getElementById("miniPlayIcon");

    const artworkPlayBtn =
        document.getElementById("artworkPlayBtn");


    // ============================================================
    // NEXT / PREVIOUS
    // ============================================================

    const previousBtn =
        document.getElementById("previousBtn");

    const nextBtn =
        document.getElementById("nextBtn");

    const miniPreviousBtn =
        document.getElementById("miniPreviousBtn");

    const miniNextBtn =
        document.getElementById("miniNextBtn");


    // ============================================================
    // SHUFFLE / REPEAT
    // ============================================================

    const shuffleBtn =
        document.getElementById("shuffleBtn");

    const repeatBtn =
        document.getElementById("repeatBtn");


    // ============================================================
    // PROGRESS
    // ============================================================

    const mediaProgress =
        document.getElementById("mediaProgress");

    const currentTime =
        document.getElementById("currentTime");

    const totalTime =
        document.getElementById("totalTime");


    // ============================================================
    // VOLUME
    // ============================================================

    const volumeControl =
        document.getElementById("volumeControl");

    const miniVolume =
        document.getElementById("miniVolume");

    const miniMuteBtn =
        document.getElementById("miniMuteBtn");

    const miniVolumeIcon =
        document.getElementById("miniVolumeIcon");


    // ============================================================
    // QUEUE
    // ============================================================

    const queueList =
        document.getElementById("queueList");

    const clearQueueBtn =
        document.getElementById("clearQueueBtn");


    // ============================================================
    // LOCAL MEDIA
    // ============================================================

    const localMediaBtn =
        document.getElementById("localMediaBtn");

    const localMediaInput =
        document.getElementById("localMediaInput");


    // ============================================================
    // SEARCH
    // ============================================================

    const mediaSearch =
        document.getElementById("mediaSearch");


    // ============================================================
    // FULLSCREEN
    // ============================================================

    const fullscreenBtn =
        document.getElementById("fullscreenBtn");


    // ============================================================
    // PLAYER INFORMATION
    // ============================================================

    const currentMediaName =
        document.getElementById("currentMediaName");

    const currentMediaArtist =
        document.getElementById("currentMediaArtist");

    const nowPlayingTitle =
        document.getElementById("nowPlayingTitle");

    const miniTrackName =
        document.getElementById("miniTrackName");

    const mediaTypeLabel =
        document.getElementById("mediaTypeLabel");
        


    // ============================================================
    // PLAYER STATE
    // ============================================================

    let currentPlayer = null;

    let currentIndex = -1;

    let queue = [];

    let isPlaying = false;

    let isShuffle = false;

    let isRepeat = false;

    let isMuted = false;

    let previousVolume = 80;

    let currentObjectUrl = null;


    // ============================================================
    // INITIAL PLAYER VOLUME
    // ============================================================

    if (mediaAudio) {
        mediaAudio.volume = 0.8;
    }

    if (mediaVideo) {
        mediaVideo.volume = 0.8;
    }


    // ============================================================
    // FORMAT TIME
    // ============================================================

    function formatTime(seconds) {

        if (!Number.isFinite(seconds)) {
            return "00:00";
        }

        const mins =
            Math.floor(seconds / 60);

        const secs =
            Math.floor(seconds % 60);

        return (
            String(mins).padStart(2, "0") +
            ":" +
            String(secs).padStart(2, "0")
        );
    }


    // ============================================================
    // FILE TYPE
    // ============================================================

    function getFileType(file) {

        if (!file || !file.type) {
            return "music";
        }

        return file.type.startsWith("video/")
            ? "video"
            : "music";
    }


    // ============================================================
    // CURRENT FILE
    // ============================================================

    function getCurrentFile() {

        if (
            currentIndex < 0 ||
            currentIndex >= queue.length
        ) {
            return null;
        }

        return queue[currentIndex];
    }


    // ============================================================
    // GET PLAYER
    // ============================================================

    function getPlayerForFile(file) {

        const type =
            getFileType(file);

        if (type === "video") {
            return mediaVideo;
        }

        return mediaAudio;
    }


    // ============================================================
    // STOP CURRENT PLAYER
    // ============================================================

    function stopCurrentPlayer() {

        if (mediaAudio) {

            mediaAudio.pause();

            mediaAudio.removeAttribute("src");

            mediaAudio.load();
        }

        if (mediaVideo) {

            mediaVideo.pause();

            mediaVideo.removeAttribute("src");

            mediaVideo.load();
        }

        isPlaying = false;
    }


    // ============================================================
    // RESET PROGRESS
    // ============================================================

    function resetProgress() {

        if (mediaProgress) {
            mediaProgress.value = 0;
        }

        if (currentTime) {
            currentTime.textContent =
                "00:00";
        }

        if (totalTime) {
            totalTime.textContent =
                "00:00";
        }
    }


    // ============================================================
    // UPDATE ARTWORK
    // ============================================================

    function updateArtwork(file) {

        const type =
            getFileType(file);

        // --------------------------------------------------------
        // ICON
        // --------------------------------------------------------

        if (artworkIcon) {

            artworkIcon.className =
                type === "video"
                    ? "fas fa-film"
                    : "fas fa-music";
        }


        if (miniArtworkIcon) {

            miniArtworkIcon.className =
                type === "video"
                    ? "fas fa-film"
                    : "fas fa-music";
        }


        // --------------------------------------------------------
        // VIDEO MODE
        // --------------------------------------------------------

        if (artwork) {

            artwork.classList.toggle(
                "video-mode",
                type === "video"
            );
        }


        // --------------------------------------------------------
        // SHOW / HIDE CONTENT
        // --------------------------------------------------------

        if (type === "video") {

            if (artworkContent) {
                artworkContent.style.display =
                    "none";
            }

            if (mediaVideo) {
                mediaVideo.style.display =
                    "block";
            }

            if (mediaAudio) {
                mediaAudio.style.display =
                    "none";
            }

        } else {

            if (artworkContent) {
                artworkContent.style.display =
                    "flex";
            }

            if (mediaVideo) {
                mediaVideo.style.display =
                    "none";
            }

            if (mediaAudio) {
                mediaAudio.style.display =
                    "none";
            }
        }
    }


    // ============================================================
    // UPDATE PLAYER INFORMATION
    // ============================================================

    function updateMediaInformation(file) {

        if (!file) {
            return;
        }

        const type =
            getFileType(file);


        if (currentMediaName) {

            currentMediaName.textContent =
                file.name;
        }


        if (nowPlayingTitle) {

            nowPlayingTitle.textContent =
                file.name;
        }


        if (miniTrackName) {

            miniTrackName.textContent =
                file.name;
        }


        if (currentMediaArtist) {

            currentMediaArtist.textContent =
                "Local Media";
        }


        if (mediaTypeLabel) {

            mediaTypeLabel.textContent =
                type === "video"
                    ? "VIDEO"
                    : "MUSIC";
        }
    }


    // ============================================================
    // UPDATE PLAY BUTTONS
    // ============================================================

    function updatePlayButtons() {

        const iconClass =
            isPlaying
                ? "fas fa-pause"
                : "fas fa-play";


        if (playPauseIcon) {

            playPauseIcon.className =
                iconClass;
        }


        if (miniPlayIcon) {

            miniPlayIcon.className =
                iconClass;
        }


        if (playPauseBtn) {

            playPauseBtn.title =
                isPlaying
                    ? "Pause"
                    : "Play";
        }


        if (miniPlayPauseBtn) {

            miniPlayPauseBtn.title =
                isPlaying
                    ? "Pause"
                    : "Play";
        }


        if (artworkPlayBtn) {

            artworkPlayBtn.innerHTML =
                isPlaying
                    ? '<i class="fas fa-pause"></i>'
                    : '<i class="fas fa-play"></i>';
        }
    }


    // ============================================================
    // LOAD MEDIA
    // ============================================================

    function loadMedia(
        index,
        autoplay = false
    ) {

        if (
            index < 0 ||
            index >= queue.length
        ) {
            return;
        }


        const file =
            queue[index];


        if (!file) {
            return;
        }


        // --------------------------------------------------------
        // STOP PREVIOUS PLAYER
        // --------------------------------------------------------

        if (mediaAudio) {

            mediaAudio.pause();

            mediaAudio.removeAttribute("src");

            mediaAudio.load();
        }


        if (mediaVideo) {

            mediaVideo.pause();

            mediaVideo.removeAttribute("src");

            mediaVideo.load();
        }


        isPlaying = false;


        // --------------------------------------------------------
        // UPDATE CURRENT INDEX
        // --------------------------------------------------------

        currentIndex =
            index;


        // --------------------------------------------------------
        // REVOKE OLD OBJECT URL
        // --------------------------------------------------------

        if (currentObjectUrl) {

            URL.revokeObjectURL(
                currentObjectUrl
            );

            currentObjectUrl = null;
        }


        // --------------------------------------------------------
        // CREATE NEW OBJECT URL
        // --------------------------------------------------------

        currentObjectUrl =
            URL.createObjectURL(file);


        // --------------------------------------------------------
        // GET PLAYER
        // --------------------------------------------------------

        const player =
            getPlayerForFile(file);


        if (!player) {

            console.error(
                "RMS Media: Player element not found."
            );

            return;
        }


        currentPlayer =
            player;


        // --------------------------------------------------------
        // SET SOURCE
        // --------------------------------------------------------

        player.src =
            currentObjectUrl;


        player.load();


        // --------------------------------------------------------
        // UPDATE INFORMATION
        // --------------------------------------------------------

        updateMediaInformation(file);


        // --------------------------------------------------------
        // UPDATE ARTWORK / VIDEO
        // --------------------------------------------------------

        updateArtwork(file);


        // --------------------------------------------------------
        // RESET PROGRESS
        // --------------------------------------------------------

        resetProgress();


        // --------------------------------------------------------
        // UPDATE QUEUE
        // --------------------------------------------------------

        renderQueue();


        // --------------------------------------------------------
        // AUTOPLAY
        // --------------------------------------------------------

        if (autoplay) {

            playCurrentMedia();
        }
    }


    // ============================================================
    // PLAY CURRENT MEDIA
    // ============================================================

    async function playCurrentMedia() {

        if (!currentPlayer) {

            if (queue.length > 0) {

                loadMedia(
                    0,
                    false
                );

            } else {

                console.log(
                    "RMS Media: No media selected"
                );

                return;
            }
        }


        if (!currentPlayer) {
            return;
        }


        try {

            await currentPlayer.play();

            isPlaying = true;

            updatePlayButtons();

        } catch (error) {

            console.error(
                "RMS Media: Playback failed:",
                error
            );
        }
    }


    // ============================================================
    // PAUSE CURRENT MEDIA
    // ============================================================

    function pauseCurrentMedia() {

        if (currentPlayer) {

            currentPlayer.pause();
        }

        isPlaying = false;

        updatePlayButtons();
    }


    // ============================================================
    // TOGGLE PLAY / PAUSE
    // ============================================================

    function togglePlay() {

        if (!currentPlayer) {

            if (queue.length > 0) {

                loadMedia(
                    0,
                    true
                );

            } else {

                console.log(
                    "RMS Media: No media selected"
                );
            }

            return;
        }


        if (currentPlayer.paused) {

            playCurrentMedia();

        } else {

            pauseCurrentMedia();
        }
    }


    // ============================================================
    // PLAY BUTTON EVENTS
    // ============================================================

    if (playPauseBtn) {

        playPauseBtn.addEventListener(
            "click",
            togglePlay
        );
    }


    if (miniPlayPauseBtn) {

        miniPlayPauseBtn.addEventListener(
            "click",
            togglePlay
        );
    }


    if (artworkPlayBtn) {

        artworkPlayBtn.addEventListener(
            "click",
            togglePlay
        );
    }


    // ============================================================
    // PLAYER EVENTS
    // ============================================================

    function attachPlayerEvents(player) {

        if (!player) {
            return;
        }


        // --------------------------------------------------------
        // METADATA
        // --------------------------------------------------------

        player.addEventListener(
            "loadedmetadata",
            function () {

                if (
                    player !== currentPlayer
                ) {
                    return;
                }


                if (totalTime) {

                    totalTime.textContent =
                        formatTime(
                            player.duration
                        );
                }


                if (mediaProgress) {

                    mediaProgress.value =
                        0;
                }


                console.log(
                    "RMS Media: Duration:",
                    player.duration
                );
            }
        );


        // --------------------------------------------------------
        // TIME UPDATE
        // --------------------------------------------------------

        player.addEventListener(
            "timeupdate",
            function () {

                if (
                    player !== currentPlayer
                ) {
                    return;
                }


                const duration =
                    player.duration;


                if (
                    !duration ||
                    !Number.isFinite(duration)
                ) {
                    return;
                }


                const percentage =
                    (
                        player.currentTime /
                        duration
                    ) * 100;


                if (mediaProgress) {

                    mediaProgress.value =
                        percentage;
                }


                if (currentTime) {

                    currentTime.textContent =
                        formatTime(
                            player.currentTime
                        );
                }


                if (totalTime) {

                    totalTime.textContent =
                        formatTime(
                            duration
                        );
                }
            }
        );


        // --------------------------------------------------------
        // PLAY
        // --------------------------------------------------------

        player.addEventListener(
            "play",
            function () {

                if (
                    player !== currentPlayer
                ) {
                    return;
                }


                isPlaying = true;

                updatePlayButtons();
            }
        );


        // --------------------------------------------------------
        // PAUSE
        // --------------------------------------------------------

        player.addEventListener(
            "pause",
            function () {

                if (
                    player !== currentPlayer
                ) {
                    return;
                }


                isPlaying = false;

                updatePlayButtons();
            }
        );


        // --------------------------------------------------------
        // ENDED
        // --------------------------------------------------------

        player.addEventListener(
            "ended",
            function () {

                if (
                    player !== currentPlayer
                ) {
                    return;
                }


                console.log(
                    "RMS Media: Track ended"
                );


                playNextTrack(true);
            }
        );


        // --------------------------------------------------------
        // ERROR
        // --------------------------------------------------------

        player.addEventListener(
            "error",
            function () {

                if (
                    player !== currentPlayer
                ) {
                    return;
                }


                console.error(
                    "RMS Media: Unable to play media.",
                    player.error
                );
            }
        );
    }


    // Attach events to the real Pug players

    attachPlayerEvents(
        mediaAudio
    );

    attachPlayerEvents(
        mediaVideo
    );


    // ============================================================
    // PROGRESS / SEEK
    // ============================================================

    if (mediaProgress) {

        mediaProgress.addEventListener(
            "input",
            function () {

                if (
                    !currentPlayer ||
                    !Number.isFinite(
                        currentPlayer.duration
                    )
                ) {
                    return;
                }


                const percentage =
                    Number(this.value);


                currentPlayer.currentTime =
                    currentPlayer.duration *
                    (
                        percentage / 100
                    );


                if (currentTime) {

                    currentTime.textContent =
                        formatTime(
                            currentPlayer.currentTime
                        );
                }
            }
        );
    }


    // ============================================================
    // NEXT TRACK
    // ============================================================

    function playNextTrack(
        fromEnded = false
    ) {

        if (!queue.length) {
            return;
        }


        // --------------------------------------------------------
        // REPEAT CURRENT TRACK
        // --------------------------------------------------------

        if (
            isRepeat &&
            fromEnded
        ) {

            loadMedia(
                currentIndex,
                true
            );

            return;
        }


        let nextIndex;


        // --------------------------------------------------------
        // SHUFFLE
        // --------------------------------------------------------

        if (
            isShuffle &&
            queue.length > 1
        ) {

            do {

                nextIndex =
                    Math.floor(
                        Math.random() *
                        queue.length
                    );

            } while (
                nextIndex === currentIndex
            );

        } else {

            // ----------------------------------------------------
            // NORMAL NEXT
            // ----------------------------------------------------

            nextIndex =
                currentIndex + 1;


            if (
                nextIndex >=
                queue.length
            ) {

                if (isRepeat) {

                    nextIndex = 0;

                } else {

                    nextIndex = -1;
                }
            }
        }


        // --------------------------------------------------------
        // QUEUE FINISHED
        // --------------------------------------------------------

        if (nextIndex === -1) {

            isPlaying = false;

            updatePlayButtons();

            resetProgress();

            return;
        }


        // --------------------------------------------------------
        // LOAD NEXT
        // --------------------------------------------------------

        loadMedia(
            nextIndex,
            true
        );
    }


    // ============================================================
    // PREVIOUS TRACK
    // ============================================================

    function playPreviousTrack() {

        if (!queue.length) {
            return;
        }


        // If more than 3 seconds played,
        // restart current track.

        if (
            currentPlayer &&
            currentPlayer.currentTime > 3
        ) {

            currentPlayer.currentTime =
                0;

            return;
        }


        let previousIndex =
            currentIndex - 1;


        if (previousIndex < 0) {

            previousIndex =
                queue.length - 1;
        }


        loadMedia(
            previousIndex,
            true
        );
    }


    // ============================================================
    // PREVIOUS BUTTONS
    // ============================================================

    if (previousBtn) {

        previousBtn.addEventListener(
            "click",
            playPreviousTrack
        );
    }


    if (miniPreviousBtn) {

        miniPreviousBtn.addEventListener(
            "click",
            playPreviousTrack
        );
    }


    // ============================================================
    // NEXT BUTTONS
    // ============================================================

    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            function () {

                playNextTrack(false);
            }
        );
    }


    if (miniNextBtn) {

        miniNextBtn.addEventListener(
            "click",
            function () {

                playNextTrack(false);
            }
        );
    }


    // ============================================================
    // SHUFFLE
    // ============================================================

    if (shuffleBtn) {

        shuffleBtn.addEventListener(
            "click",
            function () {

                isShuffle =
                    !isShuffle;


                this.classList.toggle(
                    "active",
                    isShuffle
                );


                console.log(
                    "RMS Media Shuffle:",
                    isShuffle
                );
            }
        );
    }


    // ============================================================
    // REPEAT
    // ============================================================

    if (repeatBtn) {

        repeatBtn.addEventListener(
            "click",
            function () {

                isRepeat =
                    !isRepeat;


                this.classList.toggle(
                    "active",
                    isRepeat
                );


                console.log(
                    "RMS Media Repeat:",
                    isRepeat
                );
            }
        );
    }


    // ============================================================
    // VOLUME ICON
    // ============================================================

    function updateVolumeIcon(
        value
    ) {

        if (!miniVolumeIcon) {
            return;
        }


        if (value <= 0) {

            miniVolumeIcon.className =
                "fas fa-volume-mute";

        } else if (value < 50) {

            miniVolumeIcon.className =
                "fas fa-volume-down";

        } else {

            miniVolumeIcon.className =
                "fas fa-volume-up";
        }
    }


    // ============================================================
    // SET VOLUME
    // ============================================================

    function setVolume(value) {

        value =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(value)
                )
            );


        const volume =
            value / 100;


        // --------------------------------------------------------
        // REAL AUDIO PLAYER
        // --------------------------------------------------------

        if (mediaAudio) {

            mediaAudio.volume =
                volume;

            mediaAudio.muted =
                false;
        }


        // --------------------------------------------------------
        // REAL VIDEO PLAYER
        // --------------------------------------------------------

        if (mediaVideo) {

            mediaVideo.volume =
                volume;

            mediaVideo.muted =
                false;
        }


        // --------------------------------------------------------
        // UI
        // --------------------------------------------------------

        if (volumeControl) {

            volumeControl.value =
                value;
        }


        if (miniVolume) {

            miniVolume.value =
                value;
        }


        isMuted =
            value === 0;


        updateVolumeIcon(
            value
        );
    }


    // ============================================================
    // MAIN VOLUME
    // ============================================================

    if (volumeControl) {

        volumeControl.addEventListener(
            "input",
            function () {

                setVolume(
                    this.value
                );
            }
        );
    }


    // ============================================================
    // MINI VOLUME
    // ============================================================

    if (miniVolume) {

        miniVolume.addEventListener(
            "input",
            function () {

                setVolume(
                    this.value
                );
            }
        );
    }


    // ============================================================
    // MUTE
    // ============================================================

    if (miniMuteBtn) {

        miniMuteBtn.addEventListener(
            "click",
            function () {

                if (isMuted) {

                    setVolume(
                        previousVolume
                    );

                    isMuted = false;

                } else {

                    previousVolume =
                        currentPlayer
                            ? currentPlayer.volume * 100
                            : 80;


                    if (
                        previousVolume <= 0
                    ) {

                        previousVolume =
                            80;
                    }


                    setVolume(0);

                    isMuted = true;
                }
            }
        );
    }


    // ============================================================
    // LOCAL MEDIA BUTTON
    // ============================================================

    if (
        localMediaBtn &&
        localMediaInput
    ) {

        localMediaBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                localMediaInput.click();
            }
        );
    }


    // ============================================================
    // LOCAL MEDIA FILE SELECTION
    // ============================================================

    if (localMediaInput) {

        localMediaInput.addEventListener(
            "change",
            function () {

                const files =
                    Array.from(
                        this.files || []
                    );


                if (!files.length) {
                    return;
                }


                console.log(
                    "RMS Media: Local files selected",
                    files
                );


                // ------------------------------------------------
                // LOAD FILES INTO QUEUE
                // ------------------------------------------------

                queue =
                    files;


                currentIndex =
                    0;


                // ------------------------------------------------
                // LOAD FIRST FILE
                // ------------------------------------------------

                loadMedia(
                    0,
                    false
                );


                // ------------------------------------------------
                // RENDER QUEUE
                // ------------------------------------------------

                renderQueue();


                console.log(
                    "RMS Media: Queue loaded:",
                    queue.length,
                    "files"
                );


                // Allow selecting same file again

                this.value = "";
            }
        );
    }


    // ============================================================
    // QUICK ACCESS
    // ============================================================

    document
        .querySelectorAll(".quick-card")
        .forEach(function (card) {

            card.addEventListener(
                "click",
                function () {

                    const type =
                        this.dataset.mediaType;


                    console.log(
                        "RMS Media Quick Access:",
                        type
                    );


                    // ------------------------------------------------
                    // MUSIC / VIDEO / LOCAL
                    // ------------------------------------------------

                    if (
                        (
                            type === "music" ||
                            type === "video" ||
                            type === "local"
                        ) &&
                        localMediaInput
                    ) {

                        localMediaInput.click();
                    }
                }
            );
        });


    // ============================================================
    // RENDER QUEUE
    // ============================================================

    function renderQueue() {

        if (!queueList) {
            return;
        }


        queueList.innerHTML = "";


        // --------------------------------------------------------
        // EMPTY QUEUE
        // --------------------------------------------------------

        if (!queue.length) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "empty-queue";


            empty.innerHTML = `
                <div class="empty-queue-icon">
                    <i class="fas fa-headphones"></i>
                </div>

                <strong>Your queue is empty</strong>

                <span>
                    Add music or videos to start playing
                </span>
            `;


            queueList.appendChild(
                empty
            );


            return;
        }


        // --------------------------------------------------------
        // QUEUE ITEMS
        // --------------------------------------------------------

        queue.forEach(
            function (file, index) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "queue-item";


                if (
                    index === currentIndex
                ) {

                    item.classList.add(
                        "active"
                    );
                }


                const type =
                    getFileType(file);


                item.innerHTML = `
                    <div class="queue-item-icon">
                        <i class="fas ${
                            type === "video"
                                ? "fa-film"
                                : "fa-music"
                        }"></i>
                    </div>

                    <div class="queue-item-info">
                        <strong></strong>

                        <span>
                            ${
                                type === "video"
                                    ? "Video"
                                    : "Music"
                            }
                        </span>
                    </div>

                    <div class="queue-item-number">
                        ${index + 1}
                    </div>
                `;


                const title =
                    item.querySelector(
                        ".queue-item-info strong"
                    );


                if (title) {

                    title.textContent =
                        file.name;
                }


                // ------------------------------------------------
                // CLICK QUEUE ITEM
                // ------------------------------------------------

                item.addEventListener(
                    "click",
                    function () {

                        loadMedia(
                            index,
                            true
                        );
                    }
                );


                queueList.appendChild(
                    item
                );
            }
        );
    }


    // ============================================================
    // CLEAR QUEUE
    // ============================================================

    if (clearQueueBtn) {

        clearQueueBtn.addEventListener(
            "click",
            function () {

                stopCurrentPlayer();


                queue = [];


                currentIndex =
                    -1;


                currentPlayer =
                    null;


                // ------------------------------------------------
                // REVOKE OBJECT URL
                // ------------------------------------------------

                if (currentObjectUrl) {

                    URL.revokeObjectURL(
                        currentObjectUrl
                    );

                    currentObjectUrl =
                        null;
                }


                // ------------------------------------------------
                // RESET UI
                // ------------------------------------------------

                if (currentMediaName) {

                    currentMediaName.textContent =
                        "No media selected";
                }


                if (currentMediaArtist) {

                    currentMediaArtist.textContent =
                        "Select a song or video to begin";
                }


                if (nowPlayingTitle) {

                    nowPlayingTitle.textContent =
                        "Nothing Playing";
                }


                if (miniTrackName) {

                    miniTrackName.textContent =
                        "Nothing Playing";
                }


                if (mediaTypeLabel) {

                    mediaTypeLabel.textContent =
                        "MUSIC";
                }


                if (artwork) {

                    artwork.classList.remove(
                        "video-mode"
                    );
                }


                if (artworkContent) {

                    artworkContent.style.display =
                        "flex";
                }


                if (mediaVideo) {

                    mediaVideo.style.display =
                        "none";
                }


                resetProgress();


                renderQueue();


                updatePlayButtons();


                console.log(
                    "RMS Media: Queue cleared"
                );
            }
        );
    }


    // ============================================================
    // SEARCH
    // ============================================================

    if (mediaSearch) {

        mediaSearch.addEventListener(
            "input",
            function () {

                const searchTerm =
                    this.value
                        .trim()
                        .toLowerCase();


                console.log(
                    "RMS Media Search:",
                    searchTerm
                );
            }
        );
    }


    // ============================================================
    // FULLSCREEN VIDEO
    // ============================================================

    if (fullscreenBtn) {

        fullscreenBtn.addEventListener(
            "click",
            function () {

                if (!mediaVideo) {
                    return;
                }


                if (
                    document.fullscreenElement
                ) {

                    document.exitFullscreen();

                    return;
                }


                if (
                    mediaVideo.requestFullscreen
                ) {

                    mediaVideo.requestFullscreen();

                } else {

                    console.log(
                        "RMS Media: Fullscreen not supported."
                    );
                }
            }
        );
    }
    


    // ============================================================
    // INITIAL STATE
    // ============================================================

    setVolume(80);

    updatePlayButtons();

    renderQueue();


    console.log(
        "RMS Media Player initialized."
    );

});