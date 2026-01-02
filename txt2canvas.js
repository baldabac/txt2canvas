"use strict";

var txt2canvas = {};

// set the canvas to mimic a fullscreen movie story
txt2canvas.setCanvas = () => {
  // remove old canvas in the case of repeated JS edit, copy, paste, console run
  const oldCanvas = document.getElementById(
    txt2canvas.config.canvasElementName
  );
  if (oldCanvas !== null) {
    oldCanvas.remove();
  }

  // create the canvas and style it
  const canvas = document.createElement("canvas");
  canvas.setAttribute("id", txt2canvas.config.canvasElementName);
  canvas.style.position = "fixed";
  canvas.style.top = "0px";
  canvas.style.left = "0px";
  canvas.style.bottom = "0px";
  canvas.style.right = "0px";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.display = "block";
  canvas.style.zIndex = "2147483648";
  canvas.style.background = "#fff";
  document.getElementsByTagName("body")[0].appendChild(canvas);
  const newlyCreatedCanvasNode = document.getElementById(
    txt2canvas.config.canvasElementName
  );
  newlyCreatedCanvasNode.setAttribute(
    "width",
    newlyCreatedCanvasNode.clientWidth
  );
  newlyCreatedCanvasNode.setAttribute(
    "height",
    newlyCreatedCanvasNode.clientHeight
  );
};

// extract texts from the page given a minimum text length
txt2canvas.getTexts = () =>
  document
    .getElementsByTagName("body")[0]
    .innerText.split("\n")
    .join(". ")
    .replace("   ", " ")
    .replace("  ", " ")
    .split(". ")
    .map((item) => item.trimStart())
    .map((item) => item.trimEnd())
    .filter((item) => item.length > txt2canvas.config.minimumTextLength);

txt2canvas.transformTextsIntoSlides = (texts) => {
  const canvasNode = document.getElementById(
    txt2canvas.config.canvasElementName
  );
  if (canvasNode === null) {
    console.error("Canvas node does not exist as expected");
    return;
  }

  const context = canvasNode.getContext("2d");

  let i, j, k, l, fitLineFound, fitSyllableFound;
  const slides = [];
  const maxLinesPerSlide = txt2canvas.getMaxLinesPerSlide(
    canvasNode.height,
    txt2canvas.config.fontHeight,
    txt2canvas.config.padding
  );

  context.font = txt2canvas.config.fontHeight + "px courier";
  context.textAlign = "left";
  context.textBaseline = "top";

  // test with an extra long text right on the first text/slides
  // texts[0] +=
  //   " --- extra long text test with duplicated content: " +
  //   texts[0] +
  //   " " +
  //   texts[0] +
  //   " " +
  //   texts[0] +
  //   " " +
  //   texts[0] +
  //   " " +
  //   texts[0] +
  //   " " +
  //   texts[0] +
  //   " " +
  //   texts[0] +
  //   " " +
  //   texts[0] +
  //   " " +
  //   texts[0];

  // test with some extra long words somewhere
  // texts[1] = "1:abcdefghijklmnopqrstuvwxyz2:abcdefghijklmnopqrstuvwxyz3:abcdefghijklmnopqrstuvwxyz " + texts[1] + ' aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  for (i = 0; i < texts.length; i++) {
    const maxLineWidth = canvasNode.width;
    const fullTextWords = texts[i].split(" ");
    let remainingTextWords = fullTextWords;

    const textLines = [];

    // split text[i] into lines this way:
    // starting from the end start removing words one by one until partial text fits
    // the max line width then place everything left in a remaining text holder
    // until no more remaining words
    do {
      // attempt to find a fit line from the beginning to the end
      // attempt to find a fit line from the beginning to penultimate word
      // attempt to find a fit line from the beginning to ante-penultimate wor
      // ... and so on
      fitLineFound = false;
      for (j = remainingTextWords.length - 1; j >= 0; j--) {
        const potentialLineWordsText = remainingTextWords
          .slice(0, j + 1)
          .join(" ");
        const potentialLineWordsTextMeasuredWidth = context.measureText(
          potentialLineWordsText
        ).width;
        if (
          potentialLineWordsTextMeasuredWidth <
          maxLineWidth - txt2canvas.config.padding * 2
        ) {
          // we found a line that fits on the screen width
          textLines.push(potentialLineWordsText);
          remainingTextWords = remainingTextWords.slice(j + 1);
          fitLineFound = true;
          break;
        }
      } // end looping through remainingTextWords to find a fit line

      //console.log("remainingTextWords=", remainingTextWords);

      if (fitLineFound === true) {
        continue;
      }

      // treat the edge case that at the beginning OF THE REMAINING TEXT (and anywhere in the array of words)
      // there is at least one very long word that does not fit even a single line: find them and break them
      // in something similar to syllabes starting from the end of the long words and removing
      // letters one by one until a fit line is found
      
      // attempt to split into syllables the FIRST big word in the remaining text due to which no fit line can be found
      // console.log('attempt to split into syllables the FIRST big word in the remaining text due to which no fit line can be found')

      const firstWord = remainingTextWords.shift();
      //console.log('firstWord=', firstWord)

      fitSyllableFound = false;
      for (j = firstWord.length - 1 - 1; j > 0; j--) {
        const potentialSyllable =
          firstWord
            .split("")
            .slice(0, j + 1)
            .join("") + "-";
        const potentialSyllableMeasuredWidth =
          context.measureText(potentialSyllable).width;
        if (
          potentialSyllableMeasuredWidth <
          maxLineWidth - txt2canvas.config.padding * 2
        ) {
          // we found a "syllable-" that fits on the screen width
          // console.log('we found a "syllable-" that fits on the screen width')
          // console.log('potentialSyllable=', potentialSyllable);

          fitSyllableFound = true;
          const firstSyllable = potentialSyllable; //firstWord.slice(0, j + 1) + '-';
          const remainingSyllables = "-" + firstWord.slice(j + 1);

          remainingTextWords.unshift(remainingSyllables);
          remainingTextWords.unshift(firstSyllable);
          break;
        }
      } // end looping through first word letters

      if (fitSyllableFound === false) {
        // no fit line found, no fit syllable found: the screen width must not fit
        // even a single character given the padding and fontSize
        console.error(
          "screen width is too small to fit any character given current padding and fontSize"
        );
        break; //break the forever loop
      }
    } while (remainingTextWords.length > 0);

    // for very long texts the number of lines will not fit a single screen
    // therefore we create slides with the remainder of lines by grouping
    // lines into chunks of maximum lines number that fit on the screen

    const currentTextSlidesCount = Math.ceil(
      textLines.length / maxLinesPerSlide
    );

    for (k = 0; k < currentTextSlidesCount; k++) {
      const slideLines = [];
      let slideWordsLength = 0;
      let slideDurationMiliseconds = null;

      for (
        l = k * maxLinesPerSlide;
        l < k * maxLinesPerSlide + Math.min(maxLinesPerSlide, textLines.length);
        l++
      ) {
        if (textLines[l] === undefined) break; //non-existent line

        slideLines.push(textLines[l]);
        slideWordsLength += textLines[l].split(" ").length;
      }

      slideDurationMiliseconds =
        (60 * 1000 * slideWordsLength) / txt2canvas.config.readWordsPerMinute;

      slides.push({
        lines: slideLines,
        duration: slideDurationMiliseconds,
      });
    }
  }

  return slides;
};

txt2canvas.setupMediaRecorder = (showDownloadCallback) => {
  const canvasNode = document.getElementById(
    txt2canvas.config.canvasElementName
  );
  if (canvasNode === null) {
    console.error("Canvas node does not exist as expected");
    return;
  }

  const stream = canvasNode.captureStream();
  txt2canvas.mediaRecorder = new MediaRecorder(stream);

  const chunks = [];
  txt2canvas.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  txt2canvas.mediaRecorder.onstop = () => {
    showDownloadCallback(new Blob(chunks, { type: "video/webm" }));
  };
};

txt2canvas.startRecording = () => {
  if (txt2canvas.mediaRecorder === undefined) {
    console.error("Media recorder has not been set up as expected");
    return;
  }

  txt2canvas.mediaRecorder.start();
};

txt2canvas.stopRecording = () => {
  if (txt2canvas.mediaRecorder === undefined) {
    console.error("Media recorder has not been set up as expected");
    return;
  }

  setTimeout(() => txt2canvas.mediaRecorder.stop(), 100);
};

txt2canvas.showRecordingDownloadLink = (blob) => {
  // remove old video wrapper in the case of repeated JS edit, copy, paste, console run
  const oldVideoWrapperNode = document.getElementById(
    txt2canvas.config.canvasElementName + "-video-wrapper"
  );
  if (oldVideoWrapperNode !== null) {
    oldVideoWrapperNode.remove();
  }

  // create the video wrapper
  const videoWrapperNode = document.createElement("div");
  videoWrapperNode.setAttribute(
    "id",
    txt2canvas.config.canvasElementName + "-video-wrapper"
  );
  videoWrapperNode.style.position = "fixed";
  videoWrapperNode.style.top = "0px";
  videoWrapperNode.style.left = "0px";
  videoWrapperNode.style.bottom = "0px";
  videoWrapperNode.style.right = "0px";
  videoWrapperNode.style.width = "100%";
  videoWrapperNode.style.height = "100%";
  videoWrapperNode.style.display = "table";
  videoWrapperNode.style.zIndex = "2147483649";
  videoWrapperNode.style.background = "#fff";
  videoWrapperNode.style.textAlign = "center";
  document.getElementsByTagName("body")[0].appendChild(videoWrapperNode);

  // create the video node from which we need the link for download
  const videoNode = document.createElement("video");
  videoNode.style.display = "none";
  videoNode.src = URL.createObjectURL(blob);
  videoNode.controls = true;

  videoWrapperNode.appendChild(videoNode);

  // create the download link node
  const downloadLink = document.createElement("a");
  downloadLink.textContent = "Download as .webm video";
  downloadLink.style.color = "#000";
  downloadLink.style.verticalAlign = "middle";
  downloadLink.style.display = "table-cell";
  downloadLink.href = videoNode.src;
  downloadLink.download = "txt2canvas-video.webm";

  videoWrapperNode.appendChild(downloadLink);
};

txt2canvas.playSlides = async (slides = [], fadeMiliseconds = 1000) => {
  const canvasNode = document.getElementById(
    txt2canvas.config.canvasElementName
  );
  if (canvasNode === null) {
    console.error("Canvas node does not exist as expected");
    return;
  }

  let i,
    fadeOpacity = 0,
    fadeStep = fadeMiliseconds / 100,
    outerFadeResolver,
    currentSlide;

  // a single slide fading callback that animates both fade in and fade out continuously
  const animateSlideFadePendulum = () => {
    txt2canvas.drawSlideLines(fadeOpacity / 100, currentSlide);

    // depending on the sign (+ or -) of fadeStep here it will either increment or decrement
    fadeOpacity += fadeStep;

    // when reaching the end of fade (in or out)
    if (
      (fadeStep > 0 && fadeOpacity > 100) ||
      (fadeStep < 0 && fadeOpacity < 0)
    ) {
      // prepare for the next reverse fade (fade in, fade out, fade in, fade out..)
      fadeStep = -fadeStep;

      // call the wrapping promise's resolver so that await can finish
      if (outerFadeResolver !== undefined) {
        outerFadeResolver();
      }

      // exit recursion after the end of fading
      return;
    }

    // keep displaying the current frame before going to next frame recursively
    const fadeStepDuration = Math.abs(fadeStep * 10);
    setTimeout(
      () => requestAnimationFrame(animateSlideFadePendulum),
      fadeStepDuration
    );
  };

  // emit txt2canvasEventPlaySlidesStarted
  document.dispatchEvent(
    new CustomEvent(txt2canvas.config.txt2canvasEventPlaySlidesStarted)
  );

  for (i = 0; i < slides.length; i++) {
    currentSlide = slides[i];

    await new Promise((innerFadeResolver) => {
      outerFadeResolver = innerFadeResolver;
      requestAnimationFrame(animateSlideFadePendulum);
    });

    await new Promise((resolve) =>
      setTimeout(() => {
        resolve();
      }, currentSlide.duration)
    );

    await new Promise((innerFadeResolver) => {
      outerFadeResolver = innerFadeResolver;
      requestAnimationFrame(animateSlideFadePendulum);
    });
  }

  // clear the canvas after the final slide
  canvasNode
    .getContext("2d")
    .clearRect(0, 0, canvasNode.width, canvasNode.height);

  // emit txt2canvasEventPlaySlidesFinished
  document.dispatchEvent(
    new CustomEvent(txt2canvas.config.txt2canvasEventPlaySlidesFinished)
  );
};

txt2canvas.drawSlideLines = (alpha, slide) => {
  const canvasNode = document.getElementById(
    txt2canvas.config.canvasElementName
  );
  if (canvasNode === null) {
    console.error("Canvas node does not exist as expected");
    return;
  }

  const context = canvasNode.getContext("2d");

  const maxLinesPerSlide = txt2canvas.getMaxLinesPerSlide(
    canvasNode.height,
    txt2canvas.config.fontHeight,
    txt2canvas.config.padding
  );

  // clear canvas canvas
  context.clearRect(0, 0, canvasNode.width, canvasNode.height);

  context.rect(0, 0, canvasNode.width, canvasNode.height)
  context.fillStyle = "#fff"
  context.fill()

  // draw the slide lines
  const betweenLinesDistance = Math.floor(txt2canvas.config.padding / 2);
  let verticalAlignMiddleOffset =
    (txt2canvas.config.fontHeight + betweenLinesDistance) *
      Math.max(0, Math.floor((maxLinesPerSlide - slide.lines.length) / 2)) +
    betweenLinesDistance;
  let lineXPos = txt2canvas.config.padding;
  for (let j = 0; j < slide.lines.length; j++) {
    let lineYPos =
      verticalAlignMiddleOffset +
      j * (txt2canvas.config.fontHeight + betweenLinesDistance);
    context.fillStyle = "rgb(0, 0, 0, " + alpha + ")";
    context.fillText(slide.lines[j], lineXPos, lineYPos);
  }
};

txt2canvas.getMaxLinesPerSlide = (canvasHeight) => {
  return Math.floor(
    canvasHeight /
      (txt2canvas.config.fontHeight + txt2canvas.config.padding / 2)
  );
};

txt2canvas.run = (customConfig = {}) => {
  // create the txt2canvas.config using default config and run's customConfig (if provided)
  txt2canvas.config = {
    ...txt2canvas.defaultConfig,
    ...(customConfig || {}),
  };

  const texts = txt2canvas.getTexts();
  // console.log(texts);

  txt2canvas.setCanvas();
  const slides = txt2canvas.transformTextsIntoSlides(texts);

  // enable canvas recording using custom events emitted by txt2canvas.playSlides()
  txt2canvas.setupMediaRecorder(txt2canvas.showRecordingDownloadLink);
  document.addEventListener(
    txt2canvas.config.txt2canvasEventPlaySlidesStarted,
    txt2canvas.startRecording
  );
  document.addEventListener(
    txt2canvas.config.txt2canvasEventPlaySlidesFinished,
    txt2canvas.stopRecording
  );

  // play the slides
  txt2canvas.playSlides(slides);
};

txt2canvas.defaultConfig = {
  canvasElementName: "txt2canvas-canvas",
  minimumTextLength: 3,
  readWordsPerMinute: 300,
  padding: 40,
  fontHeight: 20,
  txt2canvasEventPlaySlidesStarted: "txt2canvasEventPlaySlidesStarted",
  txt2canvasEventPlaySlidesFinished: "txt2canvasEventPlaySlidesFinished",
};

txt2canvas.run();
