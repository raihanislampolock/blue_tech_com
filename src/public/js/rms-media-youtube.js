document.addEventListener("DOMContentLoaded", function () {

    "use strict";


    // =========================================================
    // CONFIGURATION
    // =========================================================

    const API = {
        search: "/api/rms-media/youtube/search",
        video: "/api/rms-media/youtube/video",
        qualities: "/api/rms-media/youtube/qualities",
        download: "/api/rms-media/youtube/download"
    };


    // =========================================================
    // DOM ELEMENTS
    // =========================================================

    const searchForm =
        document.getElementById("youtubeSearchForm");

    const searchInput =
        document.getElementById("youtubeSearchInput");

    const searchBtn =
        document.getElementById("youtubeSearchBtn");

    const resultsSection =
        document.getElementById("youtubeResultsSection");

    const resultsContainer =
        document.getElementById("youtubeResults");

    const resultsTitle =
        document.getElementById("youtubeResultsTitle");

    const clearResultsBtn =
        document.getElementById("youtubeClearResults");

    const emptyState =
        document.getElementById("youtubeEmptyState");

    const searchStatus =
        document.getElementById("youtubeSearchStatus");

    const playerSection =
        document.getElementById("youtubePlayerSection");

    const playerFrame =
        document.getElementById("youtubePlayerFrame");

    const playerTitle =
        document.getElementById("youtubePlayerTitle");

    const playerThumbnail =
        document.getElementById("youtubePlayerThumbnail");

    const playerVideoTitle =
        document.getElementById("youtubeVideoTitle");

    const playerChannel =
        document.getElementById("youtubeVideoChannel");

    const playerDescription =
        document.getElementById("youtubeVideoDescription");

    const qualityStatus =
        document.getElementById("youtubeQualityStatus");

    const qualityList =
        document.getElementById("youtubeQualityList");

    const closePlayerBtn =
        document.getElementById("youtubeClosePlayer");


    // =========================================================
    // CURRENT STATE
    // =========================================================

    let currentVideo = null;

    let currentQualities = [];


    // =========================================================
    // SEARCH
    // =========================================================

    if (searchForm) {

        searchForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const searchTerm =
                    searchInput.value.trim();


                if (!searchTerm) {

                    showStatus(
                        "Please enter something to search.",
                        "warning"
                    );

                    return;
                }


                await searchYouTube(
                    searchTerm
                );
            }
        );
    }


    // =========================================================
    // SEARCH YOUTUBE
    // =========================================================

    async function searchYouTube(
        searchTerm
    ) {

        setSearchLoading(true);


        try {

            showStatus(
                "Searching YouTube...",
                "loading"
            );


            const response =
                await fetch(
                    `${API.search}?search=${encodeURIComponent(searchTerm)}`,
                    {
                        method: "GET",
                        headers: {
                            "Accept": "application/json"
                        }
                    }
                );


            const result =
                await response.json();


            if (!response.ok || !result.status) {

                throw new Error(
                    result.message ||
                    "YouTube search failed"
                );
            }


            const videos =
                Array.isArray(result.data)
                    ? result.data
                    : [];


            renderSearchResults(
                videos,
                searchTerm
            );


        } catch (error) {

            console.error(
                "YouTube Search Error:",
                error
            );


            renderError(
                error.message ||
                "Unable to search YouTube."
            );


        } finally {

            setSearchLoading(false);
        }
    }


    // =========================================================
    // RENDER SEARCH RESULTS
    // =========================================================

    function renderSearchResults(
        videos,
        searchTerm
    ) {

        if (!resultsContainer) {
            return;
        }


        resultsContainer.innerHTML = "";


        if (!videos.length) {

            resultsSection.style.display =
                "block";

            emptyState.style.display =
                "none";


            resultsContainer.innerHTML = `

                <div class="youtube-no-results">

                    <div class="empty-queue-icon">
                        <i class="fas fa-search"></i>
                    </div>

                    <strong>
                        No results found
                    </strong>

                    <span>
                        Try another search term.
                    </span>

                </div>
            `;


            if (resultsTitle) {

                resultsTitle.textContent =
                    "No Results";
            }


            return;
        }


        resultsSection.style.display =
            "block";

        emptyState.style.display =
            "none";


        if (resultsTitle) {

            resultsTitle.textContent =
                `Results for "${searchTerm}"`;
        }


        videos.forEach(
            function (video) {

                const card =
                    createVideoCard(
                        video
                    );


                resultsContainer.appendChild(
                    card
                );
            }
        );


        clearStatus();
    }


    // =========================================================
    // CREATE VIDEO CARD
    // =========================================================

    function createVideoCard(
        video
    ) {

        const card =
            document.createElement("div");


        card.className =
            "youtube-result-card";


        const thumbnail =
            video.thumbnail ||
            `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;


        card.innerHTML = `

            <div class="youtube-result-thumbnail">

                <img
                    src="${escapeHtml(thumbnail)}"
                    alt="${escapeHtml(video.title || "")}"
                    loading="lazy"
                >

                <span class="youtube-result-duration">
                    ${escapeHtml(video.durationText || "")}
                </span>

                <div class="youtube-result-play">
                    <i class="fas fa-play"></i>
                </div>

            </div>


            <div class="youtube-result-info">

                <h3>
                    ${escapeHtml(
                        video.title ||
                        "Unknown title"
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        video.channel ||
                        "Unknown channel"
                    )}
                </p>

            </div>


            <div class="youtube-result-actions">

                <button
                    type="button"
                    class="youtube-watch-btn"
                >
                    <i class="fas fa-play"></i>
                    Watch
                </button>

            </div>
        `;


        const watchBtn =
            card.querySelector(
                ".youtube-watch-btn"
            );


        const playArea =
            card.querySelector(
                ".youtube-result-thumbnail"
            );


        if (watchBtn) {

            watchBtn.addEventListener(
                "click",
                function () {

                    openVideo(
                        video.id
                    );
                }
            );
        }


        if (playArea) {

            playArea.addEventListener(
                "click",
                function () {

                    openVideo(
                        video.id
                    );
                }
            );
        }


        return card;
    }


    // =========================================================
    // OPEN VIDEO
    // =========================================================

    async function openVideo(
        videoId
    ) {

        if (!videoId) {
            return;
        }


        playerSection.style.display =
            "block";


        playerSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        playerTitle.textContent =
            "Loading video...";


        playerVideoTitle.textContent =
            "Loading...";


        playerChannel.textContent =
            "";


        playerDescription.textContent =
            "";


        qualityStatus.textContent =
            "Loading...";


        qualityList.innerHTML =
            "";


        renderYouTubePlayer(
            videoId
        );


        try {

            await Promise.all([
                loadVideoInformation(
                    videoId
                ),
                loadVideoQualities(
                    videoId
                )
            ]);


        } catch (error) {

            console.error(
                "Open YouTube Video Error:",
                error
            );


            qualityStatus.textContent =
                "Unable to load video information.";
        }
    }


    // =========================================================
    // LOAD VIDEO INFORMATION
    // =========================================================

    async function loadVideoInformation(
        videoId
    ) {

        const response =
            await fetch(
                `${API.video}?videoId=${encodeURIComponent(videoId)}`
            );


        const result =
            await response.json();


        if (!response.ok || !result.status) {

            throw new Error(
                result.message ||
                "Unable to load video"
            );
        }


        const video =
            result.data;


        currentVideo =
            video;


        playerTitle.textContent =
            video.title ||
            "YouTube Video";


        playerVideoTitle.textContent =
            video.title ||
            "Unknown title";


        playerChannel.textContent =
            video.channel ||
            "Unknown channel";


        playerDescription.textContent =
            video.description ||
            "";


        if (video.thumbnail) {

            playerThumbnail.src =
                video.thumbnail;

            playerThumbnail.style.display =
                "block";
        }
    }


    // =========================================================
    // LOAD QUALITIES
    // =========================================================

    async function loadVideoQualities(
        videoId
    ) {

        qualityStatus.textContent =
            "Checking available quality...";


        const response =
            await fetch(
                `${API.qualities}?videoId=${encodeURIComponent(videoId)}`
            );


        const result =
            await response.json();


        if (!response.ok || !result.status) {

            throw new Error(
                result.message ||
                "Unable to load qualities"
            );
        }


        currentQualities =
            Array.isArray(result.data)
                ? result.data
                : [];


        renderQualities(
            currentQualities
        );
    }


    // =========================================================
    // RENDER QUALITIES
    // =========================================================

    function renderQualities(
        qualities
    ) {

        qualityList.innerHTML =
            "";


        const videoQualities =
            qualities
                .filter(
                    function (quality) {

                        return (
                            quality.type ===
                            "video" &&
                            Number(quality.height) >= 1080 &&
                            Number(quality.height) <= 4320
                        );
                    }
                );


        const audioQualities =
            qualities
                .filter(
                    function (quality) {

                        return (
                            quality.type ===
                            "audio"
                        );
                    }
                );


        // -----------------------------------------------------
        // DETERMINE RESOLUTIONS
        // -----------------------------------------------------

        const resolutionMap =
            new Map();


        videoQualities.forEach(
            function (quality) {

                const height =
                    Number(
                        quality.height
                    );


                if (!height) {
                    return;
                }


                if (
                    !resolutionMap.has(
                        height
                    )
                ) {

                    resolutionMap.set(
                        height,
                        quality
                    );
                }
            }
        );


        const resolutions =
            Array.from(
                resolutionMap.keys()
            )
            .sort(
                function (a, b) {
                    return b - a;
                }
            );


        if (
            !resolutions.length &&
            !audioQualities.length
        ) {

            qualityStatus.textContent =
                "No downloadable formats found.";

            return;
        }


        qualityStatus.textContent =
            `${resolutions.length} video quality option(s) available`;


        // -----------------------------------------------------
        // VIDEO QUALITIES
        // -----------------------------------------------------

        resolutions.forEach(
            function (height) {

                const quality =
                    resolutionMap.get(
                        height
                    );


                const button =
                    createQualityButton(
                        quality
                    );


                qualityList.appendChild(
                    button
                );
            }
        );


        // -----------------------------------------------------
        // AUDIO
        // -----------------------------------------------------

        if (audioQualities.length) {

            const audioButton =
                document.createElement(
                    "button"
                );


            audioButton.type =
                "button";


            audioButton.className =
                "youtube-quality-btn audio";


            audioButton.innerHTML = `

                <span class="youtube-quality-icon">
                    <i class="fas fa-music"></i>
                </span>

                <span class="youtube-quality-info">

                    <strong>
                        MP3 Audio
                    </strong>

                    <small>
                        Best available audio
                    </small>

                </span>

                <i class="fas fa-download"></i>
            `;


            audioButton.addEventListener(
                "click",
                function () {

                    downloadYouTube(
                        "audio",
                        "best"
                    );
                }
            );


            qualityList.appendChild(
                audioButton
            );
        }
    }


    // =========================================================
    // CREATE QUALITY BUTTON
    // =========================================================

    function createQualityButton(
        quality
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "youtube-quality-btn";


        const height =
            Number(
                quality.height
            );


        let label =
            `${height}p`;


        if (height >= 4320) {

            label =
                "8K • 4320p";

        } else if (height >= 2160) {

            label =
                "4K • 2160p";

        } else if (height >= 1440) {

            label =
                "2K • 1440p";

        } else if (height >= 1080) {

            label =
                "Full HD • 1080p";

        } else if (height >= 720) {

            label =
                "HD • 720p";
        }


        const size =
            formatFileSize(
                quality.filesize ||
                quality.filesizeApprox
            );


        button.innerHTML = `

            <span class="youtube-quality-icon">

                <i class="fas fa-video"></i>

            </span>


            <span class="youtube-quality-info">

                <strong>
                    ${escapeHtml(label)}
                </strong>

                <small>

                    ${escapeHtml(
                        quality.extension ||
                        "video"
                    )}

                    ${size
                        ? " • " + escapeHtml(size)
                        : ""
                    }

                </small>

            </span>


            <i class="fas fa-download"></i>
        `;


        button.addEventListener(
            "click",
            function () {

                const requestedQuality =
                    String(
                        height
                    );


                downloadYouTube(
                    "video",
                    requestedQuality
                );
            }
        );


        return button;
    }


    // =========================================================
    // DOWNLOAD
    // =========================================================

    async function downloadYouTube(
        type,
        quality
    ) {

        if (
            !currentVideo ||
            !currentVideo.id
        ) {

            showStatus(
                "Please select a video first.",
                "warning"
            );

            return;
        }


        const buttons =
            document.querySelectorAll(
                ".youtube-quality-btn"
            );


        buttons.forEach(
            function (button) {

                button.disabled =
                    true;
            }
        );


        qualityStatus.textContent =
            "Preparing download...";


        try {

            const response =
                await fetch(
                    API.download,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                videoId:
                                    currentVideo.id,

                                type,

                                quality
                            })
                    }
                );


            if (!response.ok || !response.body) {
                const result = await response.json();

                throw new Error(
                    result.message ||
                    "Download failed"
                );
            }

            const reader =
                response.body.getReader();

            const decoder =
                new TextDecoder();

            let pending = "";
            let download = null;
            let reading = true;

            while (reading) {
                const chunk =
                    await reader.read();

                pending += decoder.decode(
                    chunk.value || new Uint8Array(),
                    { stream: !chunk.done }
                );

                const lines =
                    pending.split(/\r?\n/);

                pending =
                    lines.pop() || "";

                lines.forEach(
                    function (line) {
                        if (!line.trim()) {
                            return;
                        }

                        const event =
                            JSON.parse(line);

                        if (event.type === "progress") {
                            const progress = event.data;
                            const percent =
                                Number(progress.percent || 0).toFixed(1);

                            qualityStatus.textContent =
                                `${percent}% downloaded` +
                                (progress.downloaded
                                    ? ` of ${progress.downloaded}`
                                    : "") +
                                (progress.eta
                                    ? ` • ${progress.eta} left`
                                    : "");
                        }

                        if (event.type === "complete") {
                            download = event.data;
                        }

                        if (event.type === "error") {
                            throw new Error(
                                event.message ||
                                event.data ||
                                "Download failed"
                            );
                        }
                    }
                );

                reading = !chunk.done;
            }

            if (!download) {
                throw new Error("Download did not complete.");
            }


            qualityStatus.textContent =
                "Download ready.";


            if (download.fileUrl) {

                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    download.fileUrl;


                link.download =
                    download.fileName ||
                    "";


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();
            }


        } catch (error) {

            console.error(
                "YouTube Download Error:",
                error
            );


            qualityStatus.textContent =
                error.message ||
                "Download failed.";


        } finally {

            buttons.forEach(
                function (button) {

                    button.disabled =
                        false;
                }
            );
        }
    }


    // =========================================================
    // YOUTUBE PLAYER
    // =========================================================

    function renderYouTubePlayer(
        videoId
    ) {

        playerFrame.innerHTML = `

            <iframe

                src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0"

                title="YouTube video player"

                frameborder="0"

                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"

                allowfullscreen

            ></iframe>
        `;
    }


    // =========================================================
    // CLEAR RESULTS
    // =========================================================

    if (clearResultsBtn) {

        clearResultsBtn.addEventListener(
            "click",
            function () {

                resultsContainer.innerHTML =
                    "";

                resultsSection.style.display =
                    "none";

                emptyState.style.display =
                    "flex";

                searchInput.value =
                    "";

                closePlayer();
            }
        );
    }


    // =========================================================
    // CLOSE PLAYER
    // =========================================================

    if (closePlayerBtn) {

        closePlayerBtn.addEventListener(
            "click",
            function () {

                closePlayer();
            }
        );
    }


    function closePlayer() {

        playerFrame.innerHTML = `

            <div class="youtube-player-placeholder">

                <i class="fab fa-youtube"></i>

                <span>
                    Select a video to play
                </span>

            </div>
        `;


        playerSection.style.display =
            "none";


        currentVideo =
            null;


        currentQualities =
            [];


        qualityList.innerHTML =
            "";
    }


    // =========================================================
    // SEARCH LOADING
    // =========================================================

    function setSearchLoading(
        loading
    ) {

        if (!searchBtn) {
            return;
        }


        searchBtn.disabled =
            loading;


        if (loading) {

            searchBtn.innerHTML =
                `<i class="fas fa-spinner fa-spin"></i>`;

        } else {

            searchBtn.innerHTML =
                `<i class="fas fa-arrow-right"></i>`;
        }
    }


    // =========================================================
    // STATUS
    // =========================================================

    function showStatus(
        message,
        type
    ) {

        if (!searchStatus) {
            return;
        }


        searchStatus.style.display =
            "block";


        searchStatus.className =
            `youtube-search-status ${type || ""}`;


        searchStatus.innerHTML = `

            <i class="fas ${
                type === "warning"
                    ? "fa-exclamation-triangle"
                    : type === "loading"
                        ? "fa-spinner fa-spin"
                        : "fa-info-circle"
            }"></i>

            <span>
                ${escapeHtml(message)}
            </span>
        `;
    }


    function clearStatus() {

        if (!searchStatus) {
            return;
        }


        searchStatus.style.display =
            "none";

        searchStatus.innerHTML =
            "";
    }


    // =========================================================
    // ERROR
    // =========================================================

    function renderError(
        message
    ) {

        resultsSection.style.display =
            "block";


        emptyState.style.display =
            "none";


        resultsContainer.innerHTML = `

            <div class="youtube-no-results">

                <div class="empty-queue-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>

                <strong>
                    Something went wrong
                </strong>

                <span>
                    ${escapeHtml(message)}
                </span>

            </div>
        `;
    }


    // =========================================================
    // FILE SIZE
    // =========================================================

    function formatFileSize(
        bytes
    ) {

        if (
            !bytes ||
            Number(bytes) <= 0
        ) {

            return "";
        }


        const value =
            Number(bytes);


        const units = [
            "B",
            "KB",
            "MB",
            "GB",
            "TB"
        ];


        const index =
            Math.floor(
                Math.log(value) /
                Math.log(1024)
            );


        return (
            (value /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(1) +
            " " +
            units[index]
        );
    }


    // =========================================================
    // HTML ESCAPE
    // =========================================================

    function escapeHtml(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";
        }


        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

});