(function () {
    "use strict";

    // =========================================================
    // RMS MEDIA PLAYER - PROFESSIONAL EQUALIZER
    // =========================================================

    const RMS_EQUALIZER = {

        audioContext: null,
        source: null,
        filters: [],
        analyser: null,

        enabled: true,
        initialized: false,

        frequencies: [
            31,
            62,
            125,
            250,
            500,
            1000,
            2000,
            4000,
            8000,
            16000
        ],

        defaultGains: [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        ],

        currentGains: [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        ],

        presets: {

            Flat: [
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ],

            "Bass Boost": [
                7, 6, 5, 3, 1,
                0, 0, 0, 0, 0
            ],

            "Treble Boost": [
                0, 0, 0, 0, 0,
                1, 3, 5, 6, 7
            ],

            Rock: [
                5, 4, 3, 1, -1,
                -1, 2, 4, 5, 5
            ],

            Pop: [
                -1, 1, 3, 4, 3,
                1, -1, -2, -1, 1
            ],

            Classical: [
                4, 3, 2, 1, 0,
                0, 1, 2, 3, 4
            ],

            Jazz: [
                3, 2, 1, 2, -1,
                -1, 0, 2, 3, 4
            ],

            "Hip-Hop": [
                6, 5, 3, 1, -1,
                0, 1, 2, 2, 2
            ],

            Electronic: [
                5, 4, 2, 0, -2,
                2, 1, 3, 5, 6
            ],

            Vocal: [
                -2, -1, 0, 2, 4,
                4, 3, 2, 1, 0
            ],

            Acoustic: [
                3, 2, 1, 2, 3,
                2, 2, 3, 4, 4
            ],

            Movie: [
                4, 3, 1, 0, -1,
                1, 2, 3, 4, 5
            ],

            Gaming: [
                4, 3, 1, -1, -2,
                1, 3, 4, 3, 2
            ]
        },

        // =====================================================
        // INITIALIZE
        // =====================================================

        init: function () {

            if (this.initialized) {
                return;
            }

            console.log(
                "RMS Equalizer initializing..."
            );

            this.createUI();

            this.loadSettings();

            this.initialized = true;

            console.log(
                "RMS Equalizer initialized."
            );
        },


        // =====================================================
        // FIND MEDIA ELEMENT
        // =====================================================

        getMediaElement: function () {

            let media =
                document.querySelector(
                    "#rmsMediaAudio"
                );

            if (media) {
                return media;
            }

            media =
                document.querySelector(
                    "#audioPlayer"
                );

            if (media) {
                return media;
            }

            media =
                document.querySelector(
                    "#videoPlayer"
                );

            if (media) {
                return media;
            }

            media =
                document.querySelector(
                    "audio"
                );

            if (media) {
                return media;
            }

            media =
                document.querySelector(
                    "video"
                );

            return media || null;
        },


        // =====================================================
        // CONNECT MEDIA
        // =====================================================

        connect: function (mediaElement) {

            if (!mediaElement) {

                console.warn(
                    "RMS Equalizer: Media element not found."
                );

                return false;
            }

            try {

                if (!this.audioContext) {

                    const AudioContext =
                        window.AudioContext ||
                        window.webkitAudioContext;

                    if (!AudioContext) {

                        console.error(
                            "Web Audio API is not supported."
                        );

                        return false;
                    }

                    this.audioContext =
                        new AudioContext();
                }


                // Prevent creating multiple sources
                if (!this.source) {

                    this.source =
                        this.audioContext
                            .createMediaElementSource(
                                mediaElement
                            );
                }


                // Remove previous filters
                this.filters = [];


                let previousNode =
                    this.source;


                // =================================================
                // CREATE 10-BAND FILTERS
                // =================================================

                this.frequencies.forEach(
                    (frequency, index) => {

                        const filter =
                            this.audioContext
                                .createBiquadFilter();


                        filter.type =
                            "peaking";


                        filter.frequency.value =
                            frequency;


                        filter.Q.value =
                            1;


                        filter.gain.value =
                            this.currentGains[index];


                        this.filters.push(
                            filter
                        );


                        previousNode.connect(
                            filter
                        );


                        previousNode =
                            filter;
                    }
                );


                // =================================================
                // ANALYSER
                // =================================================

                this.analyser =
                    this.audioContext
                        .createAnalyser();


                this.analyser.fftSize =
                    2048;


                previousNode.connect(
                    this.analyser
                );


                this.analyser.connect(
                    this.audioContext.destination
                );


                console.log(
                    "RMS Equalizer connected."
                );

                return true;

            } catch (error) {

                console.error(
                    "RMS Equalizer connection error:",
                    error
                );

                return false;
            }
        },


        // =====================================================
        // RESUME AUDIO CONTEXT
        // =====================================================

        resume: function () {

            if (
                this.audioContext &&
                this.audioContext.state === "suspended"
            ) {

                this.audioContext.resume()
                    .catch(function (error) {

                        console.error(
                            "Unable to resume AudioContext:",
                            error
                        );

                    });
            }
        },


        // =====================================================
        // SET BAND
        // =====================================================

        setBand: function (
            index,
            value
        ) {

            if (
                index < 0 ||
                index >= this.filters.length
            ) {
                return;
            }


            let gain =
                Number(value);


            if (Number.isNaN(gain)) {
                gain = 0;
            }


            gain =
                Math.max(
                    -12,
                    Math.min(
                        12,
                        gain
                    )
                );


            this.currentGains[index] =
                gain;


            if (this.filters[index]) {

                this.filters[index].gain.value =
                    this.enabled
                        ? gain
                        : 0;
            }


            this.updateBandDisplay(
                index,
                gain
            );


            this.saveSettings();
        },


        // =====================================================
        // ENABLE / DISABLE
        // =====================================================

        toggle: function () {

            this.enabled =
                !this.enabled;


            this.filters.forEach(
                function (filter, index) {

                    filter.gain.value =
                        RMS_EQUALIZER.enabled
                            ? RMS_EQUALIZER.currentGains[index]
                            : 0;

                }
            );


            this.updateEnabledUI();

            this.saveSettings();
        },


        // =====================================================
        // APPLY PRESET
        // =====================================================

        applyPreset: function (
            presetName
        ) {

            const preset =
                this.presets[presetName];


            if (!preset) {
                return;
            }


            preset.forEach(
                function (gain, index) {

                    RMS_EQUALIZER.currentGains[index] =
                        gain;


                    if (
                        RMS_EQUALIZER.filters[index]
                    ) {

                        RMS_EQUALIZER.filters[index]
                            .gain.value =
                            RMS_EQUALIZER.enabled
                                ? gain
                                : 0;
                    }


                    RMS_EQUALIZER.updateBandDisplay(
                        index,
                        gain
                    );

                }
            );


            const presetSelect =
                document.querySelector(
                    "#rmsEqualizerPreset"
                );


            if (presetSelect) {

                presetSelect.value =
                    presetName;
            }


            this.saveSettings();
        },


        // =====================================================
        // RESET
        // =====================================================

        reset: function () {

            this.applyPreset(
                "Flat"
            );

            console.log(
                "RMS Equalizer reset."
            );
        },


        // =====================================================
        // CREATE UI
        // =====================================================

        createUI: function () {

            const container =
                document.querySelector(
                    "#rmsEqualizerContainer"
                );


            if (!container) {

                console.warn(
                    "RMS Equalizer container not found."
                );

                return;
            }


            container.innerHTML = "";


            // =================================================
            // HEADER
            // =================================================

            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "rms-equalizer-header";


            header.innerHTML = `
                <div>
                    <div class="rms-equalizer-title">
                        <i class="fas fa-sliders-h"></i>
                        RMS Equalizer
                    </div>

                    <div class="rms-equalizer-subtitle">
                        Professional 10-Band Audio Equalizer
                    </div>
                </div>

                <div class="rms-equalizer-controls">

                    <select
                        id="rmsEqualizerPreset"
                        class="rms-equalizer-preset"
                    >
                    </select>

                    <button
                        type="button"
                        id="rmsEqualizerReset"
                        class="rms-equalizer-button"
                    >
                        <i class="fas fa-undo"></i>
                        Reset
                    </button>

                    <button
                        type="button"
                        id="rmsEqualizerToggle"
                        class="rms-equalizer-button active"
                    >
                        <i class="fas fa-power-off"></i>
                        EQ ON
                    </button>

                </div>
            `;


            container.appendChild(
                header
            );


            // =================================================
            // PRESETS
            // =================================================

            const select =
                header.querySelector(
                    "#rmsEqualizerPreset"
                );


            Object.keys(
                this.presets
            ).forEach(
                function (presetName) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        presetName;

                    option.textContent =
                        presetName;

                    select.appendChild(
                        option
                    );
                }
            );


            // =================================================
            // BANDS
            // =================================================

            const bands =
                document.createElement(
                    "div"
                );


            bands.className =
                "rms-equalizer-bands";


            this.frequencies.forEach(
                function (
                    frequency,
                    index
                ) {

                    const band =
                        document.createElement(
                            "div"
                        );


                    band.className =
                        "rms-equalizer-band";


                    const value =
                        RMS_EQUALIZER.currentGains[index];


                    band.innerHTML = `

                        <div
                            class="rms-equalizer-value"
                            id="rmsEqValue${index}"
                        >
                            ${value} dB
                        </div>

                        <input
                            type="range"
                            class="rms-equalizer-slider"
                            id="rmsEqSlider${index}"
                            min="-12"
                            max="12"
                            step="0.5"
                            value="${value}"
                            data-index="${index}"
                        >

                        <div
                            class="rms-equalizer-frequency"
                        >
                            ${RMS_EQUALIZER.formatFrequency(
                                frequency
                            )}
                        </div>

                    `;


                    bands.appendChild(
                        band
                    );
                }
            );


            container.appendChild(
                bands
            );


            // =================================================
            // EVENTS
            // =================================================

            container.addEventListener(
                "input",
                function (event) {

                    const slider =
                        event.target.closest(
                            ".rms-equalizer-slider"
                        );


                    if (!slider) {
                        return;
                    }


                    const index =
                        Number(
                            slider.dataset.index
                        );


                    RMS_EQUALIZER.setBand(
                        index,
                        slider.value
                    );
                }
            );


            select.addEventListener(
                "change",
                function () {

                    RMS_EQUALIZER.applyPreset(
                        this.value
                    );
                }
            );


            const resetButton =
                header.querySelector(
                    "#rmsEqualizerReset"
                );


            resetButton.addEventListener(
                "click",
                function () {

                    RMS_EQUALIZER.reset();
                }
            );


            const toggleButton =
                header.querySelector(
                    "#rmsEqualizerToggle"
                );


            toggleButton.addEventListener(
                "click",
                function () {

                    RMS_EQUALIZER.toggle();
                }
            );
        },


        // =====================================================
        // UPDATE BAND DISPLAY
        // =====================================================

        updateBandDisplay: function (
            index,
            gain
        ) {

            const slider =
                document.querySelector(
                    "#rmsEqSlider" + index
                );


            const value =
                document.querySelector(
                    "#rmsEqValue" + index
                );


            if (slider) {

                slider.value =
                    gain;
            }


            if (value) {

                value.textContent =
                    (gain > 0 ? "+" : "") +
                    gain +
                    " dB";
            }
        },


        // =====================================================
        // UPDATE POWER BUTTON
        // =====================================================

        updateEnabledUI: function () {

            const button =
                document.querySelector(
                    "#rmsEqualizerToggle"
                );


            if (!button) {
                return;
            }


            if (this.enabled) {

                button.classList.add(
                    "active"
                );

                button.innerHTML = `
                    <i class="fas fa-power-off"></i>
                    EQ ON
                `;

            } else {

                button.classList.remove(
                    "active"
                );

                button.innerHTML = `
                    <i class="fas fa-power-off"></i>
                    EQ OFF
                `;
            }
        },


        // =====================================================
        // FORMAT FREQUENCY
        // =====================================================

        formatFrequency: function (
            frequency
        ) {

            if (frequency >= 1000) {

                return (
                    frequency / 1000
                ) + "k";
            }

            return frequency;
        },


        // =====================================================
        // SAVE SETTINGS
        // =====================================================

        saveSettings: function () {

            try {

                localStorage.setItem(
                    "rmsMediaEqualizer",
                    JSON.stringify({

                        enabled:
                            this.enabled,

                        gains:
                            this.currentGains
                    })
                );

            } catch (error) {

                console.warn(
                    "Unable to save equalizer settings:",
                    error
                );
            }
        },


        // =====================================================
        // LOAD SETTINGS
        // =====================================================

        loadSettings: function () {

            try {

                const saved =
                    localStorage.getItem(
                        "rmsMediaEqualizer"
                    );


                if (!saved) {

                    this.currentGains =
                        [...this.defaultGains];

                    return;
                }


                const data =
                    JSON.parse(saved);


                if (
                    Array.isArray(
                        data.gains
                    ) &&
                    data.gains.length ===
                        this.frequencies.length
                ) {

                    this.currentGains =
                        data.gains.map(
                            function (value) {

                                const number =
                                    Number(value);

                                return Number.isNaN(
                                    number
                                )
                                    ? 0
                                    : number;
                            }
                        );
                }


                if (
                    typeof data.enabled ===
                    "boolean"
                ) {

                    this.enabled =
                        data.enabled;
                }


                this.currentGains.forEach(
                    function (gain, index) {

                        RMS_EQUALIZER.updateBandDisplay(
                            index,
                            gain
                        );
                    }
                );


                this.updateEnabledUI();

            } catch (error) {

                console.warn(
                    "Unable to load equalizer settings:",
                    error
                );
            }
        }
    };


    // =========================================================
    // GLOBAL
    // =========================================================

    window.RMS_EQUALIZER =
        RMS_EQUALIZER;


    // =========================================================
    // AUTO INITIALIZE
    // =========================================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            RMS_EQUALIZER.init();


            // -------------------------------------------------
            // Automatically connect to existing audio/video
            // -------------------------------------------------

            const media =
                RMS_EQUALIZER.getMediaElement();


            if (media) {

                RMS_EQUALIZER.connect(
                    media
                );


                media.addEventListener(
                    "play",
                    function () {

                        RMS_EQUALIZER.resume();

                    }
                );
            }
        }
    );

})();