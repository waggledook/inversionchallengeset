// Define loadScript if not already defined
function loadScript(url, callback) {
  const script = document.createElement("script");
  script.src = url;
  script.onload = callback;
  document.head.appendChild(script);
}

// Load jsPDF and AutoTable
loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => {
  loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js", () => {
    console.log("jsPDF and AutoTable loaded!");
  });
});

// The rest of your code (including the InversionSetGame class) follows...


class InversionSetGame {
    constructor(sentences) {
        this.originalSentences = sentences;
        this.sentences = this.shuffle([...sentences]);
        this.currentIndex = 0;
        this.score = 0;
        this.wrongAnswers = [];
        this.totalSentences = 12; // Fixed set of 12 sentences
        this.pointsInterval = null; // For per-sentence timer
        this.gameActive = false;
        this.reviewMode = false;
        this.phaseDuration = 40000; // 40 seconds per sentence
        this.initUI();
    }

    shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    initUI() {
      console.log("Inversion Set Game script is running!");
      document.body.innerHTML = `
          <style>
              body {
                  font-family: 'Poppins', sans-serif;
                  background: linear-gradient(135deg, #2E3192, #1BFFFF);
                  color: white;
                  text-align: center;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
              }
              #game-container {
                  background: rgba(0, 0, 0, 0.8);
                  padding: 20px;
                  border-radius: 10px;
                  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
                  text-align: center;
                  margin-top: 20px;
              }
              p {
                  font-size: 18px;
              }
              input {
                  padding: 10px;
                  font-size: 16px;
                  border-radius: 5px;
                  border: none;
                  outline: none;
                  text-align: center;
                  width: 80%;
                  display: block;
                  margin: 10px auto;
              }
              input.correct {
                  border: 2px solid #00FF00;
                  background-color: rgba(0,255,0,0.2);
              }
              input.incorrect {
                  border: 2px solid #FF0000;
                  background-color: rgba(255,0,0,0.2);
              }
              button {
                  padding: 10px 20px;
                  font-size: 18px;
                  margin-top: 10px;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                  transition: background 0.3s ease, transform 0.2s ease;
              }
              button:hover {
                  opacity: 0.8;
                  transform: translateY(-2px);
              }
              button:active {
                  transform: translateY(1px);
              }
              #start {
                  background: linear-gradient(135deg, #32CD32, #228B22);
                  color: white;
              }
              #restart {
                  background: linear-gradient(135deg, #339AF0, #1C7ED6);
                  color: white;
                  display: none;
              }
              #review {
                  background: linear-gradient(135deg, #FFD700, #FFA500);
                  color: black;
                  display: none;
              }
              #downloadReport {
                  background: linear-gradient(135deg, #FF857A, #FF5E57);
                  color: white;
                  margin-top: 20px;
                  display: none;
              }
              .original-sentence {
                  color: #FFD700;
                  font-weight: bold;
                  margin-bottom: 0.5em;
              }
              .gapped-sentence {
                  color: #00FFFF;
                  font-style: italic;
                  margin-top: 0;
              }
              .game-over {
                  font-size: 24px;
                  margin-bottom: 10px;
                  font-weight: bold;
              }
              .new-high {
                  font-size: 20px;
                  color: #28a745;
              }
              #timer-bar {
                  width: 100%;
                  height: 10px;
                  background: red;
                  transition: width 1s linear;
              }
              #instructions-overlay {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  background: rgba(0, 0, 0, 0.8);
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 1000;
              }
              #instructions-box {
                  background: #333;
                  padding: 20px;
                  border-radius: 10px;
                  max-width: 500px;
                  width: 90%;
                  text-align: left;
              }
              #instructions-box h2 {
                  margin-top: 0;
              }
              #close-instructions {
                  margin-top: 15px;
                  padding: 5px 10px;
                  background: #28a745;
                  border: none;
                  border-radius: 5px;
                  color: white;
                  cursor: pointer;
                  transition: opacity 0.3s;
              }
              #close-instructions:hover {
                  opacity: 0.8;
              }
          </style>
  
          <div id="instructions-overlay">
              <div id="instructions-box">
                  <h2>How to Play</h2>
                  <p>Welcome to the Inversion Sentence Challenge (Set Mode)!</p>
                  <p>You will be given 12 sentences.</p>
                  <p>For each sentence, complete the inversion using the incomplete prompt.</p>
                  <p>You have 40 seconds for each sentence—the faster you answer, the more bonus points you earn!</p>
                  <p>When time runs out, you can still answer, but the score is clamped at 10 points for a correct answer.</p>
                  <p>Incorrect answers cost 25 points.</p>
                  <p>Good luck!</p>
                  <button id="close-instructions">Got It!</button>
              </div>
          </div>
  
          <div id="game-container">
              <img src="images/inversion-challenge.png" alt="Inversion Challenge" style="max-width: 300px; margin-bottom: 20px;">
              <div id="timer-bar"></div>
              <p id="timer">Time for this sentence: 40s</p>
              <p id="sentence"></p>
              <input type="text" id="answer" autofocus>
              <p id="feedback"></p>
              <p>Score: <span id="score">0</span></p>
              <p>Best Score: <span id="bestScore">0</span></p>
              <p id="counter">Sentence: 0/12</p>
              <button id="start">Start Game</button>
              <button id="restart">Restart</button>
              <button id="review">Review Mistakes</button>
              <button id="downloadReport">Download Report</button>
          </div>
      `;
  
      document.getElementById("close-instructions").addEventListener("click", () => {
          document.getElementById("instructions-overlay").style.display = "none";
      });
  
      document.getElementById("start").addEventListener("click", () => this.startGame());
      document.getElementById("restart").addEventListener("click", () => this.restartGame());
      document.getElementById("review").addEventListener("click", () => this.startReview());
      this.setupInputListener();
      this.updateBestScoreDisplay();
  }  

    setupInputListener() {
        document.getElementById("answer").addEventListener("keyup", (event) => {
            if (event.key === "Enter") {
                this.checkAnswer();
            }
        });
    }

    updateBestScoreDisplay() {
        let storedBest = localStorage.getItem("bestScoreInversionSet") || 0;
        document.getElementById("bestScore").textContent = storedBest;
    }

    startGame() {
        this.gameActive = true;
        this.reviewMode = false;
        this.currentIndex = 0;
        this.score = 0;
        this.wrongAnswers = [];
        // Shuffle and pick 12 sentences
        this.sentences = this.shuffle([...this.originalSentences]).slice(0, this.totalSentences);

        // Clear any previous timer
        clearInterval(this.pointsInterval);

        // Update UI
        document.getElementById("start").style.display = "none";
        document.getElementById("restart").style.display = "block";
        document.getElementById("review").style.display = "none";
        document.getElementById("downloadReport").style.display = "none";
        document.getElementById("score").textContent = this.score;
        document.getElementById("feedback").textContent = "";
        document.getElementById("counter").textContent = `Sentence: 0/${this.totalSentences}`;
        document.getElementById("answer").value = "";
        document.getElementById("answer").focus();

        this.updateSentence();
    }

    updateSentence() {
  // If we've done all 12, end the game
  if (this.currentIndex >= this.totalSentences) {
      this.endGame();
      return;
  }

  // Otherwise, show the next sentence
  document.getElementById("counter").textContent = 
    `Sentence: ${this.currentIndex + 1}/${this.totalSentences}`;
  const currentSentence = this.sentences[this.currentIndex];

  // Instead of .textContent, we use .innerHTML with two distinct <p> tags
  document.getElementById("sentence").innerHTML = `
    <p class="original-sentence">${currentSentence.sentence}</p>
    <p class="gapped-sentence">${currentSentence.incompleteSentence}</p>
  `;

  const input = document.getElementById("answer");
  input.value = "";
  input.focus();

        // Start the 40s timer
        this.startClickTime = Date.now();
        if (this.pointsInterval) clearInterval(this.pointsInterval);
        this.pointsInterval = setInterval(() => {
            let elapsed = Date.now() - this.startClickTime;
            // Decrease from 100 to 10 points over 40s
            const phaseDuration = this.phaseDuration; // 40000 ms
            let availablePoints = Math.max(
                100 - Math.floor(elapsed / (phaseDuration / (100 - 10))),
                10
            );
            let percentage = ((availablePoints - 10) / (100 - 10)) * 100;
            document.getElementById("timer-bar").style.width = percentage + "%";

            // Update the "Time for this sentence: XXs"
            let timeLeft = Math.max(0, Math.ceil((phaseDuration - elapsed) / 1000));
            document.getElementById("timer").textContent = `Time for this sentence: ${timeLeft}s`;

            // If time is fully up, clamp to 0 on the bar, but DO NOT auto-advance
            if (elapsed >= phaseDuration) {
                // Just clamp the bar to 0%
                document.getElementById("timer-bar").style.width = "0%";
                // We do NOT auto-advance or auto-award points. The user can still answer
                clearInterval(this.pointsInterval);
            }
        }, 100);
    }

    checkAnswer() {
      if (!this.gameActive && !this.reviewMode) return;
  
      const input = document.getElementById("answer");
      const userInput = input.value.trim().toLowerCase();
  
      const currentSet = this.reviewMode ? this.wrongAnswers : this.sentences;
      const currentSentence = currentSet[this.currentIndex];
  
      // Handle both correctAnswer (string or array) safely
      const correctAnswersRaw = currentSentence.correctAnswers || currentSentence.correctAnswer;
      const correctAnswers = Array.isArray(correctAnswersRaw) ? correctAnswersRaw : [correctAnswersRaw];
      const normalizedCorrectAnswers = correctAnswers.map(ans => ans.toLowerCase());
  
      currentSentence.userAnswer = userInput || "(no answer)";
      currentSentence.wasCorrect = normalizedCorrectAnswers.includes(userInput);
  
      let elapsed = Date.now() - this.startClickTime;
      const phaseDuration = this.phaseDuration;
      let availablePoints = Math.max(
          100 - Math.floor(elapsed / (phaseDuration / (100 - 10))),
          10
      );
  
      if (currentSentence.wasCorrect) {
          if (!this.reviewMode) {
              this.score += availablePoints;
              document.getElementById("score").textContent = this.score;
          }
          input.classList.add("correct");
  
          setTimeout(() => {
              input.classList.remove("correct");
              input.value = "";
              clearInterval(this.pointsInterval);
  
              this.currentIndex++;
              if (this.reviewMode) {
                  this.showReviewSentence();
              } else {
                  this.updateSentence();
              }
          }, 500);
  
      } else {
          if (!this.reviewMode) {
              this.score -= 25;
              document.getElementById("score").textContent = this.score;
          }
          input.classList.add("incorrect");
          document.getElementById("feedback").textContent =
              `Incorrect: Correct answer${correctAnswers.length > 1 ? 's' : ''} ${correctAnswers.join(" / ")}`;
  
          if (!this.reviewMode) {
              this.wrongAnswers.push({
                  sentence: currentSentence.sentence,
                  incompleteSentence: currentSentence.incompleteSentence,
                  correctAnswers: correctAnswers,
                  userAnswer: userInput || "(no answer)"
              });
          }
  
          setTimeout(() => {
              input.classList.remove("incorrect");
              input.value = "";
              clearInterval(this.pointsInterval);
  
              this.currentIndex++;
              if (this.reviewMode) {
                  this.showReviewSentence();
              } else {
                  this.updateSentence();
              }
          }, 1000);
      }
  }  

    endGame() {
        this.gameActive = false;
        if (this.pointsInterval) clearInterval(this.pointsInterval);

        // Check and update best score (using key bestScoreInversionSet)
        let storedBest = localStorage.getItem("bestScoreInversionSet") || 0;
        let newHighScore = false;
        if (this.score > storedBest) {
            localStorage.setItem("bestScoreInversionSet", this.score);
            newHighScore = true;
        }
        this.updateBestScoreDisplay();

        // Build Game Over message
        let endMessage = `
            <div class="game-over">Game Over!</div>
            <div>Your score: ${this.score}</div>
        `;
        if (newHighScore) {
            endMessage += `<div class="new-high">New High Score!</div>`;
        }
        document.getElementById("sentence").innerHTML = endMessage;

        // Hide answer input and clear feedback
        document.getElementById("answer").style.display = "none";
        document.getElementById("feedback").textContent = "";

        // Show restart and review buttons (if mistakes exist)
        document.getElementById("restart").style.display = "block";
        document.getElementById("review").style.display = this.wrongAnswers.length > 0 ? "block" : "none";

        // Show Download Report button if there are mistakes
        if (this.wrongAnswers.length > 0) {
            const reportButton = document.getElementById("downloadReport");
            if (reportButton) {
                reportButton.style.display = "block";
                if (!reportButton.dataset.listenerAdded) {
                    reportButton.addEventListener("click", () => this.generateReport());
                    reportButton.dataset.listenerAdded = "true";
                }
            }
        }
    }

    startReview() {
        if (this.wrongAnswers.length === 0) return;
        this.reviewMode = true;
        this.currentIndex = 0;
        document.getElementById("answer").style.display = "block";
        this.showReviewSentence();
    }

    showReviewSentence() {
        if (this.currentIndex < this.wrongAnswers.length) {
            const currentMistake = this.wrongAnswers[this.currentIndex];
            const displayText = `${currentMistake.sentence}\n\n${currentMistake.incompleteSentence}`;
            document.getElementById("sentence").textContent = displayText;
            const input = document.getElementById("answer");
            input.value = "";
            input.focus();
            document.getElementById("feedback").textContent = "";
        } else {
            document.getElementById("sentence").textContent = "Review complete!";
            document.getElementById("answer").style.display = "none";
            document.getElementById("feedback").textContent = "";
            this.reviewMode = false;
            this.currentIndex = 0;
        }
    }

    generateReport() {
      if (!window.jspdf || !window.jspdf.jsPDF) {
          console.error("jsPDF and its plugins have not loaded yet.");
          alert("Report generation is not ready yet. Please try again in a moment.");
          return;
      }
  
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
  
      if (typeof doc.autoTable !== "function") {
          console.error("autoTable is not attached to jsPDF.");
          alert("AutoTable plugin is not available.");
          return;
      }
  
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 150);
      doc.text("Inversion Challenge - Full Report", 14, 20);
  
      const answeredSentences = this.sentences.filter(s => s.userAnswer !== undefined);
  
      const tableRows = answeredSentences.map((s, index) => {
          const userAns = s.userAnswer || "(no answer)";
          const correctAnswersRaw = s.correctAnswers || s.correctAnswer;
          const correctAnswers = Array.isArray(correctAnswersRaw) ? correctAnswersRaw : [correctAnswersRaw];
  
          const userCorrect = correctAnswers.some(
              correct => userAns.trim().toLowerCase() === correct.trim().toLowerCase()
          );
  
          const result = userCorrect ? "Correct" : "Incorrect";
  
          return [
              index + 1,
              s.sentence,
              s.incompleteSentence,
              userAns,
              correctAnswers.join(" / "),
              result
          ];
      });
  
      doc.autoTable({
          startY: 30,
          head: [["#", "Original Sentence", "Gapped Sentence", "Your Answer", "Correct Answer(s)", "Result"]],
          body: tableRows,
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          bodyStyles: { fontSize: 10, cellPadding: 3 },
          alternateRowStyles: { fillColor: [255, 255, 255] },
          margin: { left: 10, right: 10 },
          styles: { overflow: 'linebreak' },
          didParseCell: function(data) {
              if (data.section === 'body') {
                  if (data.column.index === 3) {  // User answer
                      const result = data.row.raw[5];
                      data.cell.styles.textColor = result === "Correct" ? [0, 128, 0] : [255, 0, 0];
                      data.cell.styles.fontStyle = "bold";
                  }
  
                  if (data.column.index === 4) {  // Correct answers column
                      data.cell.styles.fontStyle = "bold";
                  }
  
                  if (data.column.index === 5) {  // Result column
                      data.cell.styles.textColor = data.cell.raw === "Correct" ? [0, 128, 0] : [255, 0, 0];
                      data.cell.styles.fontStyle = "bold";
                  }
              }
          }
      });
  
      doc.save("inversion_challenge_report.pdf");
  }  

    restartGame() {
        this.gameActive = false;
        this.reviewMode = false;
        if (this.pointsInterval) clearInterval(this.pointsInterval);
        this.currentIndex = 0;
        this.score = 0;
        this.wrongAnswers = [];

        // Reshuffle and pick a new set of 12 sentences
        this.sentences = this.shuffle([...this.originalSentences]).slice(0, this.totalSentences);

        // Reset UI
        document.getElementById("score").textContent = this.score;
        document.getElementById("feedback").textContent = "";
        document.getElementById("sentence").textContent = "";
        const input = document.getElementById("answer");
        input.value = "";
        input.style.display = "block";
        input.focus();

        document.getElementById("timer").textContent = "Time for this sentence: 40s";
        document.getElementById("timer-bar").style.width = "100%";
        document.getElementById("counter").textContent = "Sentence: 0/12";

        document.getElementById("review").style.display = "none";
        document.getElementById("restart").style.display = "none";
        document.getElementById("start").style.display = "block";
    }
}

// Sentences with negative adverbial prompts for inversion
const sentences = [
    { 
        sentence: "I had just sat down when the train left.", 
        incompleteSentence: "No sooner ________ the train left.", 
        correctAnswer: "had I sat down than"
    },
    { 
        sentence: "I didn't realize my mistake until years later.", 
        incompleteSentence: "Not until ________ realize my mistake.", 
        correctAnswer: "years later did I"
    },
    { 
        sentence: "We have never seen such magnificent scenery.", 
        incompleteSentence: "Never ________ magnificent scenery.", 
        correctAnswer: "have we seen such"
    },
    { 
        sentence: "We only understood what he had really suffered when we read his autobiography.", 
        incompleteSentence: "Only when ________ understand what he had really suffered.", 
        correctAnswer: "we read his autobiography did we"
    },
    { 
        sentence: "We had just started when we heard someone knocking at the door.", 
        incompleteSentence: "Hardly ________ we heard someone knocking at the door.", 
        correctAnswer: "had we started when"
    },
    { 
        sentence: "I have rarely read such a badly written book.", 
        incompleteSentence: "Rarely ________ badly written book.", 
        correctAnswer: "have I read such a"
    },
    { 
        sentence: "We did not put down our tools and rest until the sun set.", 
        incompleteSentence: "Not until ________ down our tools and rest.", 
        correctAnswer: "the sun set did we put"
    },
    { 
        sentence: "The hotel room was not only depressing, but it was cold as well.", 
        incompleteSentence: "Not only ________ depressing, but it was cold as well.", 
        correctAnswer: "was the hotel room"
    },
    { 
        sentence: "They only lit the fire when it was unusually cold.", 
        incompleteSentence: "Only when ________ they light the fire.", 
        correctAnswer: "it was unusually cold did"
    },
    { 
        sentence: "Shortly after he had gone to sleep there was a knock on the door.", 
        incompleteSentence: "No sooner ________ there was a knock on the door.", 
        correctAnswer: "had he gone to sleep than"
    },
    { 
        sentence: "I spoke to the manager and the problem was sorted out.", 
        incompleteSentence: "Only when ________ the problem sorted out.", 
        correctAnswer: "I spoke to the manager was"
    },
    { 
        sentence: "He has never regretted the decision he took on that day.", 
        incompleteSentence: "Never ________ he took on that day.", 
        correctAnswer: "has he regretted the decision"
    },
    { 
        sentence: "I only destroyed the evidence when the police arrived.", 
        incompleteSentence: "Scarcely ________ the police arrived.", 
        correctAnswer: ["had I destroyed the evidence when", "did I destroy the evidence when"]
    },
    { 
        sentence: "I only realized the full scale of the disaster when I watched the six o'clock news.", 
        incompleteSentence: "Only then ________ of the disaster.", 
        correctAnswer: ["did I realize the full scale", "did I realise the full scale"]
    },
    { 
        sentence: "We rarely sit down as a family to eat dinner together.", 
        incompleteSentence: "Rarely ________ to eat dinner together.", 
        correctAnswer: "do we sit down as a family"
    },
    { 
        sentence: "Shortly after we sat down to start eating, somebody's phone rang.", 
        incompleteSentence: "No sooner ________ eating than somebody's phone rang.", 
        correctAnswer: ["had we sat down to start", "did we sit down to start"]
    },
    { 
        sentence: "You shouldn't stick your head out of the window while the train is moving.", 
        incompleteSentence: "On no account ________ out of the window while the train is moving.", 
        correctAnswer: "should you stick your head"
    },
    { 
        sentence: "As soon as the race started, it began to rain.", 
        incompleteSentence: "No sooner ________ it began to rain.", 
        correctAnswer: ["had the race started than", "did the race start than"]
    },
    { 
        sentence: "I have never read such a boring book.", 
        incompleteSentence: "Never before ________ boring book.", 
        correctAnswer: "have I read such a"
    },
    { 
        sentence: "This door must not be left open at any time.", 
        incompleteSentence: "At no time ________ open.", 
        correctAnswer: "must this door be left"
    },
    { 
        sentence: "Children must not be left unattended under any circumstances.", 
        incompleteSentence: "Under no ________ unattended.", 
        correctAnswer: "circumstances must children be left"
    },
    { 
        sentence: "The police only caught the man when his wife came forward.", 
        incompleteSentence: "Only when ________ police catch him.", 
        correctAnswer: "his wife came forward did the"
    },
    { 
        sentence: "The identity of the murderer is not revealed until the very last page.", 
        incompleteSentence: "Not until ________ of the murderer revealed.", 
        correctAnswer: "the very last page is the identity"
    },
    { 
        sentence: "He would never play in front of a live audience again.", 
        incompleteSentence: "Never again ________ a live audience.", 
        correctAnswer: "would he play in front of"
    },
    { 
        sentence: "She had hardly sat down to watch her favourite program when the phone rang.", 
        incompleteSentence: "Hardly ________ her favourite program when the phone rang.", 
        correctAnswer: "had she sat down to watch"
    },
    { 
        sentence: "They only realised the painting had been hung upside down when someone complained at reception.", 
        incompleteSentence: "Only when ________ realise the painting had been hung upside down.", 
        correctAnswer: "someone complained at reception did they"
    },
    { 
        sentence: "You will not be allowed to enter the auditorium under any circumstances once the play has started.", 
        incompleteSentence: "Under no ________ to enter the auditorium once the play has started.", 
        correctAnswer: "circumstances will you be allowed"
    },
    { 
        sentence: "John had not enjoyed himself so much since he went to the theme park as a child.", 
        incompleteSentence: "Not since John went to the theme ________ enjoyed himself so much.", 
        correctAnswer: "park as a child had he"
    },
    { 
        sentence: "A film has rarely won as many awards as this one did today.", 
        incompleteSentence: "Seldom ________ awards as this one did today.", 
        correctAnswer: "has a film won as many"
    },
    { 
        sentence: "I won't ever allow myself to be deceived by him again.", 
        incompleteSentence: "Never again ________ be deceived by him.", 
        correctAnswer: "will I allow myself to"
    },
    { 
        sentence: "One rarely finds someone with such integrity as Harold.", 
        incompleteSentence: "Seldom ________ such integrity as Harold.", 
        correctAnswer: "does one find someone with"
    },
    { 
        sentence: "He loves counting all his money more than anything.", 
        incompleteSentence: "Nothing ________ counting his money.", 
        correctAnswer: "does he love more than"
    },
    { 
        sentence: "He little suspected what she was up to.", 
        incompleteSentence: "Little ________ she was up to.", 
        correctAnswer: "did he suspect what"
    },
    { 
        sentence: "Nobody has ever spoken to me like that!", 
        incompleteSentence: "Never before ________ like that!", 
        correctAnswer: "has anybody spoken to me"
    },
    { 
        sentence: "You won't find a kinder man anywhere.", 
        incompleteSentence: "Nowhere ________ man.", 
        correctAnswer: "will you find a kinder"
    },
    { 
        sentence: "She was rude and she was really unkind.", 
        incompleteSentence: "Not only ________ really unkind.", 
        correctAnswer: "was she rude but she was also"
    },
    { 
        sentence: "Her reaction couldn't possibly be described as sympathetic.", 
        incompleteSentence: "In no way ________ described as sympathetic.", 
        correctAnswer: "could her reaction possibly be"
    },
    { 
        sentence: "As soon as one war ended, the Ruritanians started another one.", 
        incompleteSentence: "No sooner ________ the Ruritanians started another one.", 
        correctAnswer: ["had one war ended than", "did one war end than"]
    },
    { 
        sentence: "He didn't realize the error of his ways until she threatened to leave him.", 
        incompleteSentence: "Not until she ________ realize the error of his ways.", 
        correctAnswer: "threatened to leave him did he"
    },
    {
    sentence: "I had never expected to win the lottery.",
    incompleteSentence: "Never ______ the lottery.",
    correctAnswer: "had I expected to win"
  },
  {
    sentence: "I had never considered such an outcome possible.",
    incompleteSentence: "Never ______ outcome possible.",
    correctAnswer: "had I considered such an"
  },

  // RARELY
  {
    sentence: "I had rarely seen a sunset as beautiful as that.",
    incompleteSentence: "Rarely ______ beautiful as that.",
    correctAnswer: "had I seen a sunset as"
  },
  {
    sentence: "I have rarely witnessed such extraordinary courage.",
    incompleteSentence: "Rarely ______ extraordinary courage.",
    correctAnswer: "have I witnessed such"
  },

  // SELDOM
  {
    sentence: "I seldom encountered problems of this magnitude.",
    incompleteSentence: "Seldom ______ this magnitude.",
    correctAnswer: "did I encounter problems of"
  },
  {
    sentence: "I seldom thought the project would succeed.",
    incompleteSentence: "Seldom ______ succeed.",
    correctAnswer: "did I think the project would"
  },

  // HARDLY EVER
  {
    sentence: "I hardly ever participate in community events in the neighbourhood.",
    incompleteSentence: "Hardly ever ______ events in the neighbourhood.",
    correctAnswer: "do I participate in community"
  },
  
  // NOT UNTIL...
  {
    sentence: "I didn’t notice my mistake until I had examined all the evidence.",
    incompleteSentence: "Not until I had ______ notice my mistake.",
    correctAnswer: "examined all the evidence did I"
  },
  {
    sentence: "I didn’t appreciate the importance of family until I had been isolated.",
    incompleteSentence: "Not until I had ______ the importance of family.",
    correctAnswer: "been isolated did I appreciate"
  },
  // NO SOONER... THAN...
  {
    sentence: "I opened the door and immediately I recognized her voice.",
    incompleteSentence: "No sooner ______ I recognized her voice.",
    correctAnswer: ["had I opened the door than", "did I open the door than"]
  },

  // SCARCELY... WHEN...
  {
    sentence: "I had just sat down when the performance began.",
    incompleteSentence: "Scarcely ______ the performance began.",
    correctAnswer: "had I sat down when"
  },
  {
    sentence: "I understood the truth when she finally spoke up.",
    incompleteSentence: "Only when she ______ the truth.",
    correctAnswer: "finally spoke up did I understand"
  },

  // ONLY AFTER...
  {
    sentence: "I learned my lesson after I made a costly mistake.",
    incompleteSentence: "Only after I had ______ my lesson.",
    correctAnswer: "made a costly mistake did I learn"
  },
  {
    sentence: "I appreciated my freedom after I was confined for a while.",
    incompleteSentence: "Only after ______ my freedom.",
    correctAnswer: ["I was confined did I appreciate", "I was confined for a while did I appreciate"]
  },

  // ONLY IF...
  {
    sentence: "I will forgive him if he apologizes sincerely.",
    incompleteSentence: "Only if he ______ forgive him.",
    correctAnswer: ["apologizes sincerely will I", "apologises sincerely will I"]
  },
  {
    sentence: "I attend the party if I'm invited.",
    incompleteSentence: "Only if ______ the party.",
    correctAnswer: ["I am invited will I attend", "I'm invited will I attend"]
  },
  {
    sentence: "I grasped the full impact of the decision later.",
    incompleteSentence: "Only later ______ impact of the decision.",
    correctAnswer: "did I grasp the full"
  },
  {
    sentence: "I recognized the consequences of my actions later.",
    incompleteSentence: "Only later ______ of my actions.",
    correctAnswer: ["did I recognize the consequences", "did I recognise the consequences"]
  },

  // ONLY BY...
  {
    sentence: "I managed to solve the p uzzle by thinking outside the box.",
    incompleteSentence: "Only by thinking______ to solve the puzzle.",
    correctAnswer: "outside the box did I manage"
  },
  {
    sentence: "I achieved victory by sacrificing my comfort.",
    incompleteSentence: "Only by sacrificing______ victory.",
    correctAnswer: "my comfort did I achieve"
  },

  // ONLY IN THIS WAY...
  {
    sentence: "I was able to foster unity in the group through a unique approach.",
    incompleteSentence: "Only in this way ______ unity in the group.",
    correctAnswer: "was I able to foster"
  },

  // NOT ONLY... BUT ALSO...
  {
    sentence: "I completed the assignment and exceeded expectations.",
    incompleteSentence: "Not only ______ but also exceeded expectations.",
    correctAnswer: "did I complete the assignment"
  },
  {
    sentence: "I mastered the instrument and learned its theory.",
    incompleteSentence: "Not only ______ but also learned its theory.",
    correctAnswer: "did I master the instrument"
  },

  // NOWHERE
  {
    sentence: "I found a location that was unrivaled in beauty.",
    incompleteSentence: "Nowhere ______ as unrivaled in beauty.",
    correctAnswer: ["did I find a location", "did I find a location that was"]
  },

  // IN NO WAY
  {
    sentence: "I cannot justify his actions in any manner.",
    incompleteSentence: "In no way ______ actions.",
    correctAnswer: "can I justify his"
  },

  // AT NO TIME
  {
    sentence: "I never suspected his true intentions.",
    incompleteSentence: "At no time ______ true intentions.",
    correctAnswer: "did I suspect his"
  },

  // UNDER NO CIRCUMSTANCES
  {
    sentence: "I wouldn’t compromise my principles under any circumstances.",
    incompleteSentence: "Under ______ my principles.",
    correctAnswer: "no circumstances would I compromise"
  },

  // ON NO ACCOUNT
  {
    sentence: "I will tolerate such behaviour under any condition.",
    incompleteSentence: "On no ______ such behaviour.",
    correctAnswer: "account will I tolerate"
  },

  // IN NO CASE
  {
    sentence: "I would allow that mistake in any situation.",
    incompleteSentence: "In no case ______ mistake.",
    correctAnswer: "would I allow that"
  },
  {
    sentence: "I realized the truth about the matter very late.",
    incompleteSentence: "Little ______ about the matter.",
    correctAnswer: ["did I realize the truth", "did I realise the truth"]
  },
  {
    sentence: "I recognized his talent only after I had listened to his performance.",
    incompleteSentence: "Only after I had ________  I recognize his talent.",
    correctAnswer: "listened to his performance did"
  },
  {
    sentence: "I would attend the meeting only if I were invited.",
    incompleteSentence: "Only if ________ the meeting",
    correctAnswer: "I were invited would I attend"
  },
  {
    sentence: "I understood the consequences only later.",
    incompleteSentence: "Only  ________ the consequences.",
    correctAnswer: "later did I understand"
  },
  {
    sentence: "I succeeded only by persevering through hardships.",
    incompleteSentence: "Only by ________  I succeed.",
    correctAnswer: "persevering through hardships did"
  },
  {
    sentence: "I achieved success only in this way.",
    incompleteSentence: "Only in this  ________ success.",
    correctAnswer: "way could I achieve"
  }

];

const game = new InversionSetGame(sentences);

