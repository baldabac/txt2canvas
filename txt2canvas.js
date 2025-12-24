"use strict";

var txt2canvas = {};

txt2canvas.defaultConfig = {
  canvasElementName: "txt2canvas-canvas",
  minimumTextLength: 100,
  readWordsPerMinute: 300,
  padding: 40,
  fontHeight: 20,
};

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
  canvas.style.background = "#000";
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

  let i, j, k, l;
  const slides = [];
  const maxLinesPerSlide = txt2canvas.getMaxLinesPerSlide(
    canvasNode.height,
    txt2canvas.config.fontHeight,
    txt2canvas.config.padding
  );

  context.font = txt2canvas.config.fontHeight + "px courier";
  context.textAlign = "left";
  context.fillStyle = "white";
  context.textBaseline = "top";

  // test with an extra long text right on the first text/slides
  //   texts[0] +=
  //     " --- extra long text test with duplicated content: " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0];

  for (i = 0; i < texts.length; i++) {
    const maxLineWidth = canvasNode.width;
    const fullTextWords = texts[i].split(" ");
    let remainingTextWords = fullTextWords;

    const textLines = [];

    // split text[i] into lines this way:
    // remove words one by one until partial text fits the max line width
    // then place everything left in a remaining text holder
    // until no more remaining words
    do {
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
          break;
        }
      }
      //console.log('remainingTextWords=',remainingTextWords);
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
        // old fillText
        slideLines.push(textLines[l]);
        slideWordsLength += textLines[l].split(" ").length;
      }

      slideDurationMiliseconds =
        (60 * 1000 * slideWordsLength) / txt2canvas.config.readWordsPerMinute;

      const slide = {
        lines: slideLines,
        duration: slideDurationMiliseconds,
      };

      slides.push(slide);
    }
  }

  return slides;
};

txt2canvas.startRecording = () => {
  const canvasNode = document.getElementById(
    txt2canvas.config.canvasElementName
  );
  if (canvasNode === null) {
    console.error("Canvas node does not exist as expected");
    return;
  }

  const stream = canvasNode.captureStream();
  const mediaRecorder = new MediaRecorder(stream);
  const chunks = [];

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = (e) => {
    txt2canvas.showRecordingDownloadLink(
      new Blob(chunks, { type: "video/webm" })
    );
  };

  mediaRecorder.start();
  return mediaRecorder;
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
  videoWrapperNode.style.background = "#000";
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
  downloadLink.style.color = "#fff";
  downloadLink.style.verticalAlign = "middle";
  downloadLink.style.display = "table-cell";
  downloadLink.href = videoNode.src;
  downloadLink.download = "txt2canvas-video.webm";

  videoWrapperNode.appendChild(downloadLink);
};

// play an array of slides
txt2canvas.playSlides = async (
  slides = [],
  mediaRecorder,
  fadeMiliseconds = 1000
) => {
  const canvasNode = document.getElementById(
    txt2canvas.config.canvasElementName
  );
  if (canvasNode === null) {
    console.error("Canvas node does not exist as expected");
    return;
  }

  const maxLinesPerSlide = txt2canvas.getMaxLinesPerSlide(
    canvasNode.height,
    txt2canvas.config.fontHeight,
    txt2canvas.config.padding
  );

  const context = canvasNode.getContext("2d");
  let i = 0, // slide iterator
    fadeInOpacity = 0,
    fadeOutOpacity = 100,
    fadeStep = fadeMiliseconds / 100;

  // prepare the callback for requestAnimationFrame() to display slides on canvas
  const fnRequestAnimationFrame = () => {
    // recursion exit condition
    if (slides[i] === undefined) {
      // clear the canvas after the final slide
      context.clearRect(0, 0, canvasNode.width, canvasNode.height);
      // stop the media recorder
      setTimeout(() => mediaRecorder.stop(), 100);
      return;
    }

    // the first slide always starts with opacity 0
    if (i === 0 && fadeInOpacity === 0 && fadeOutOpacity === 100) {
      context.globalAlpha = 0.0;
    }

    //console.log('fadeInOpacity=',fadeInOpacity)
    //console.log('fadeOutOpacity=',fadeOutOpacity)

    // clear canvas canvas
    context.clearRect(0, 0, canvasNode.width, canvasNode.height);

    // visually follow slide number (for debugging)
    //context.fillText('Slide ' + i + ' of ' + (slides.length - 1) + ': ', 0, 0);

    // draw the slide lines
    const betweenLinesDistance = Math.floor(txt2canvas.config.padding / 2);
    let verticalAlignMiddleOffset =
      (txt2canvas.config.fontHeight + betweenLinesDistance) *
        Math.max(
          0,
          Math.floor((maxLinesPerSlide - slides[i].lines.length) / 2)
        ) +
      betweenLinesDistance;
    let lineXPos = txt2canvas.config.padding;
    for (let j = 0; j < slides[i].lines.length; j++) {
      let lineYPos =
        verticalAlignMiddleOffset +
        j * (txt2canvas.config.fontHeight + betweenLinesDistance);
      context.fillText(slides[i].lines[j], lineXPos, lineYPos);
    }

    // determine and set the slide's opacity conditionally
    // determine and set the requestAnimationFrameTimeout conditionally
    let requestAnimationFrameTimeout = 0;
    if (fadeInOpacity === 0) {
      // fade in just started
      context.globalAlpha = 0.0;
      fadeInOpacity += fadeStep;
      requestAnimationFrameTimeout = fadeStep * 10;
    } else if (fadeInOpacity > 0 && fadeInOpacity < 100) {
      // fade in is in progress
      context.globalAlpha = fadeInOpacity / 100;
      fadeInOpacity += fadeStep;
      requestAnimationFrameTimeout = fadeStep * 10;
    } else if (fadeInOpacity === 100 && fadeOutOpacity === 100) {
      // fade in finished
      context.globalAlpha = 1.0;
      fadeOutOpacity -= fadeStep;
      requestAnimationFrameTimeout = slides[i].duration;
    } else if (fadeOutOpacity < 100 && fadeOutOpacity > 0) {
      // fade out is in progress
      // fade out started and not yet finished
      context.globalAlpha = fadeOutOpacity / 100;
      fadeOutOpacity -= fadeStep;
      requestAnimationFrameTimeout = fadeStep * 10;
    } else if (fadeOutOpacity === 0) {
      // fade out finished
      context.globalAlpha = 0.0;
      fadeInOpacity = 0;
      fadeOutOpacity = 100;
      requestAnimationFrameTimeout = fadeStep * 10;

      // move to next slide only when fadeOutOpacity reaches 0
      i++;
    }

    //console.log('requestAnimationFrameTimeout=',requestAnimationFrameTimeout)

    // wait requestAnimationFrameTimeout miliseconds before going to the next animation frame of a slide
    setTimeout(() => {
      requestAnimationFrame(fnRequestAnimationFrame);
    }, requestAnimationFrameTimeout);
  };

  requestAnimationFrame(fnRequestAnimationFrame);
};

txt2canvas.getMaxLinesPerSlide = (canvasHeight) => {
  return Math.floor(
    canvasHeight /
      (txt2canvas.config.fontHeight + txt2canvas.config.padding / 2)
  );
};

txt2canvas.run = () => {
  txt2canvas.config = {
    ...txt2canvas.defaultConfig,
    ...(txt2canvas.config || {}),
  };

  txt2canvas.setCanvas();
  const texts = txt2canvas.getTexts();
  const slides = txt2canvas.transformTextsIntoSlides(texts);

  const mediaRecorder = txt2canvas.startRecording();

  txt2canvas.playSlides(slides, mediaRecorder);
};

// txt2canvas.config = {
//   fontHeight: 10
// };

txt2canvas.run();
