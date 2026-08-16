# Storybook Template

Use this template when the user asks for a new storybook. All storybooks share the same look, feel, and feature set.

## Workflow

1. User describes the story concept (characters, setting, theme)
2. Claude writes 8-12 pages of story (max 2 sentences per page, simple words for age 4)
3. Claude creates `websites/games/<story_name>/` directory
4. Claude creates `<story_name>.html` using the HTML template below
5. Claude generates 1 image prompt per page (claymation style, consistent characters)
6. Claude adds the entry to `websites/main/public/index.html` in the entertainment category
7. User generates images, adds them to the directory
8. Commit and push

## Naming Convention

- Directory: `websites/games/<story_name>/` (snake_case)
- HTML file: `<story_name>.html`
- Images: `<prefix>_<scene>.png` (e.g., `puppy_intro.png`, `bunny_garden.png`)

## Story Writing Rules

- Target age: 4 years old
- Max 2 sentences per page
- Use simple, common words only
- 8-12 pages total
- Page 1: introduce characters
- Page 2: set up the adventure
- Pages 3-N-2: adventures/activities
- Page N-1: happy/satisfied feeling
- Page N: bedtime/goodnight ending

## Image Prompt Style

All prompts must include:
- "Claymation style" as the first words
- Consistent character descriptions (colors, features) repeated in every prompt
- "Bright saturated colors, smooth clay texture"
- "No text" at the end
- Scene-specific details matching the page text

## HTML Template

The HTML below is the canonical storybook template. To create a new storybook, copy this and replace:
- `<TITLE>` — browser tab title
- `<IMG_ALT>` — alt text base (e.g., "Puppy Picture", "Bunny Picture")
- The `story` array entries (text, img, alt, bg)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title><TITLE></title>
    <style>
        * {
            box-sizing: border-box;
            user-select: none;
            -webkit-user-select: none;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
            min-height: 100vh;
            transition: background-color 0.6s ease;
        }

        .page-container {
            width: 100%;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 20px;
            overflow-y: auto;
        }

        .image-box {
            position: relative;
            width: 100%;
            max-width: 550px;
            height: 320px;
            background-color: #E2F0D9;
            border: 6px dashed #70AD47;
            border-radius: 25px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px;
            text-align: center;
            margin-bottom: 20px;
            overflow: hidden;
        }

        .image-box img {
            max-width: 100%;
            max-height: 100%;
            border-radius: 15px;
            object-fit: contain;
            pointer-events: none;
        }

        .image-box p {
            font-size: 1.2rem;
            color: #555;
            margin: 0;
            pointer-events: none;
        }

        .slide {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 1;
            transition: opacity 0.4s ease;
        }

        .slide.is-hidden {
            display: none;
        }

        .slide.fade-out {
            opacity: 0;
        }

        .pic-nav-zone {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 50%;
            z-index: 5;
            cursor: pointer;
            display: flex;
            align-items: center;
        }

        #pic-left-zone {
            left: 0;
            justify-content: flex-start;
            padding-left: 8px;
        }

        #pic-right-zone {
            right: 0;
            justify-content: flex-end;
            padding-right: 8px;
        }

        .pic-nav-zone:active {
            background-color: rgba(255, 255, 255, 0.3);
        }

        .nav-arrow {
            font-size: 2rem;
            color: rgba(0, 0, 0, 0.15);
            pointer-events: none;
            transition: color 0.2s;
        }

        .pic-nav-zone:active .nav-arrow {
            color: rgba(0, 0, 0, 0.4);
        }

        .read-btn {
            background-color: #FF6F61;
            color: white;
            font-size: 2rem;
            font-weight: bold;
            border: none;
            padding: 15px 40px;
            border-radius: 50px;
            box-shadow: 0 8px 0 #D64535;
            cursor: pointer;
            margin: 10px 0 20px 0;
            transition: transform 0.1s;
        }

        .read-btn:active {
            transform: translateY(4px);
            box-shadow: 0 4px 0 #D64535;
        }

        .text-box {
            text-align: center;
            padding: 10px;
            max-width: 900px;
            margin-bottom: 20px;
        }

        .word {
            display: inline-block;
            font-size: 3.2rem;
            font-weight: bold;
            color: #2E4057;
            margin: 6px 8px;
            padding: 8px 14px;
            border-radius: 14px;
            cursor: pointer;
            transition: transform 0.15s, background-color 0.15s;
        }

        .word:active, .word.highlight {
            background-color: #FFE66D;
            color: #000;
            transform: scale(1.1);
        }

        @keyframes wordBounce {
            0%   { transform: scale(1); }
            30%  { transform: scale(1.25) translateY(-6px); }
            50%  { transform: scale(1.1) translateY(0); }
            70%  { transform: scale(1.15) translateY(-3px); }
            100% { transform: scale(1); }
        }

        .word.bounce {
            animation: wordBounce 0.5s ease;
        }

        .star-progress {
            display: flex;
            gap: 6px;
            justify-content: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .star {
            font-size: 1.6rem;
            transition: transform 0.3s;
        }

        .star.filled {
            transform: scale(1.15);
        }

        @keyframes confettiFall {
            0%   { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        .confetti-piece {
            position: fixed;
            top: -20px;
            width: 12px;
            height: 12px;
            border-radius: 2px;
            z-index: 100;
            pointer-events: none;
            animation: confettiFall linear forwards;
        }

        .text-box.fade-enter {
            animation: fadeIn 0.4s ease forwards;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>

    <div class="page-container">
        <div class="image-box">
            <div id="pic-left-zone" class="pic-nav-zone" onclick="prevPage()">
                <span class="nav-arrow">&#9664;</span>
            </div>
            <div id="pic-right-zone" class="pic-nav-zone" onclick="nextPage()">
                <span class="nav-arrow">&#9654;</span>
            </div>

            <div id="img-content" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
            </div>
        </div>

        <button class="read-btn" onclick="readFullPage()">&#128266; Read To Me</button>

        <div class="text-box" id="text-container"></div>

        <div class="star-progress" id="star-progress"></div>
    </div>

    <script>
        // === REPLACE THIS ARRAY WITH YOUR STORY ===
        const story = [
            {
                text: "Page 1 text here.",
                img: "prefix_scene1.png",
                alt: "[ Picture: description ]",
                bg: "#FFF9E6"
            }
            // ... more pages
        ];

        let currentPage = 0;
        const synth = window.speechSynthesis;
        const MAX_RETRIES = 3;
        const memoryCache = [];

        const slides = story.map(page => {
            const wrap = document.createElement('div');
            wrap.className = 'slide is-hidden';

            const img = document.createElement('img');
            img.alt = '<IMG_ALT>';
            img.decoding = 'sync';
            img.loading = 'eager';

            const fallback = document.createElement('p');
            fallback.textContent = page.alt;
            fallback.style.display = 'none';

            const slide = { wrap, img, fallback, src: page.img, tries: 0 };

            img.addEventListener('load', () => {
                img.style.display = '';
                fallback.style.display = 'none';
            });
            img.addEventListener('error', () => retryImage(slide));

            wrap.append(img, fallback);
            document.getElementById('img-content').appendChild(wrap);

            loadImage(slide);
            memoryCache.push(img);
            return slide;
        });

        function loadImage(slide) {
            slide.img.src = slide.tries === 0
                ? slide.src
                : `${slide.src}?reload=${slide.tries}`;
        }

        function retryImage(slide) {
            if (slide.tries < MAX_RETRIES) {
                slide.tries++;
                setTimeout(() => loadImage(slide), 300 * slide.tries);
            } else {
                slide.img.style.display = 'none';
                slide.fallback.style.display = 'block';
            }
        }

        function verifyImage(slide) {
            if (slide.img.complete && slide.img.naturalWidth === 0) {
                retryImage(slide);
            }
        }

        function buildStars() {
            const container = document.getElementById('star-progress');
            container.innerHTML = '';
            for (let i = 0; i < story.length; i++) {
                const star = document.createElement('span');
                star.className = 'star' + (i <= currentPage ? ' filled' : '');
                star.textContent = i <= currentPage ? '\u2B50' : '\u2606';
                container.appendChild(star);
            }
        }

        function loadPage() {
            synth.cancel();
            const p = story[currentPage];

            document.body.style.backgroundColor = p.bg;

            slides.forEach((slide, i) => {
                slide.wrap.classList.toggle('is-hidden', i !== currentPage);
            });
            verifyImage(slides[currentPage]);
            setTimeout(() => verifyImage(slides[currentPage]), 1200);

            const textContainer = document.getElementById('text-container');
            const words = p.text.split(' ');

            textContainer.innerHTML = words.map(word => {
                const cleanWord = word.replace(/[^a-zA-Z']/g, "");
                return `<span class="word" onclick="speakWord(event, '${cleanWord}')">${word}</span>`;
            }).join(' ');

            textContainer.classList.remove('fade-enter');
            void textContainer.offsetWidth;
            textContainer.classList.add('fade-enter');

            buildStars();
            window.scrollTo(0, 0);

            if (currentPage === story.length - 1) {
                launchConfetti();
            }
        }

        function speakWord(event, word) {
            event.stopPropagation();
            if (!word) return;

            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.rate = 0.8;

            const element = event.currentTarget;
            element.classList.add('highlight', 'bounce');
            utterance.onend = () => {
                element.classList.remove('highlight');
            };
            element.addEventListener('animationend', () => {
                element.classList.remove('bounce');
            }, { once: true });

            synth.speak(utterance);
        }

        function readFullPage() {
            synth.cancel();
            const fullText = story[currentPage].text;
            const utterance = new SpeechSynthesisUtterance(fullText);
            utterance.rate = 0.85;

            const wordEls = document.querySelectorAll('.word');
            let wordIndex = 0;

            utterance.onboundary = (e) => {
                if (e.name === 'word' && wordIndex < wordEls.length) {
                    wordEls.forEach(w => w.classList.remove('highlight'));
                    wordEls[wordIndex].classList.add('highlight');
                    wordIndex++;
                }
            };

            utterance.onend = () => {
                wordEls.forEach(w => w.classList.remove('highlight'));
            };

            synth.speak(utterance);
        }

        let lastTurn = 0;
        function tapAccepted() {
            const now = Date.now();
            if (now - lastTurn < 250) return false;
            lastTurn = now;
            return true;
        }

        function nextPage() {
            if (!tapAccepted()) return;
            if (currentPage < story.length - 1) {
                currentPage++;
                loadPage();
            }
        }

        function prevPage() {
            if (!tapAccepted()) return;
            if (currentPage > 0) {
                currentPage--;
                loadPage();
            }
        }

        function launchConfetti() {
            const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6FCF', '#A66CFF'];
            for (let i = 0; i < 40; i++) {
                const piece = document.createElement('div');
                piece.className = 'confetti-piece';
                piece.style.left = Math.random() * 100 + 'vw';
                piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                piece.style.animationDuration = (2 + Math.random() * 3) + 's';
                piece.style.animationDelay = (Math.random() * 1.5) + 's';
                piece.style.width = (8 + Math.random() * 10) + 'px';
                piece.style.height = (8 + Math.random() * 10) + 'px';
                piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
                document.body.appendChild(piece);
                piece.addEventListener('animationend', () => piece.remove());
            }
        }

        loadPage();
    </script>
</body>
</html>
```

## Pastel Background Color Palette

Pick a different soft pastel for each page. Suggested palette:

| Color     | Hex       | Mood         |
|-----------|-----------|--------------|
| Warm cream | `#FFF9E6` | Intro/warm   |
| Light blue | `#E6F7FF` | Sky/water    |
| Peach      | `#FFF0E6` | Active/warm  |
| Lavender   | `#F0E6FF` | Playful      |
| Mint       | `#E6FFE6` | Nature       |
| Aqua       | `#E6FFFA` | Ocean        |
| Butter     | `#FFFDE6` | Sunny        |
| Pink       | `#FFE6F0` | Celebration  |
| Rose       | `#FFF0F5` | Happy/sunset |
| Periwinkle | `#E6E6FA` | Night/sleep  |
