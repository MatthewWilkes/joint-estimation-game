// Settings
PPU = 5; // Pixels per base unit.
xMax = 100; // Maximum size of a bar in base units.
trialIndex = -1;
stimulusYSize = 0;
enter_lock = true;
click_lock = true;
stimulus_timeout = 1; // Time in seconds for which a stimulus is displayed.
response_timeout = 2; // Time in seconds for which a response is allowed.
partner_timeout = 3; // Time in seconds for which partner's guess is displayed.
trainN = 0; // Define number of training trials.
testN = trainN + 50; // Define number of test trails (over training trials).

// Specify location information for stimuli, responses, and buttons.
inset = 1;
stimulus_x_start = 50;
stimulus_y_start = 150;
stimulus_bg_width = 500;
stimulus_bg_height = 25;
response_x_start = 100;
response_y_start = 350;
response_bg_width = 500;
response_bg_height = 25;
change_guess_y = stimulus_y_start + stimulus_bg_height
accept_partner_y = stimulus_y_start + 3*stimulus_bg_height
accept_own_y = stimulus_y_start + 5*stimulus_bg_height

// Specify colors for own, partner, and stimulus boxes.
partner_guess_color = "#0b6b13";
own_guess_color = "#0B486B";
stimulus_color = "#b32113";

// Create the agent.
create_agent = function() {
    reqwest({
        url: "/node/" + participant_id,
        method: 'post',
        type: 'json',
        success: function (resp) {
            my_node_id = resp.node.id;
            if (my_node_id === 2){
              partner_node_id = 3
            } else {
              partner_node_id = 2
            }
            get_info();
        },
        error: function (err) {
            console.log(err);
            err_response = JSON.parse(err.response);
            if (err_response.hasOwnProperty('html')) {
                $('body').html(err_response.html);
            } else {
                allow_exit();
                go_to_page('postquestionnaire');
            }
        }
    });
};

//
// Check for partner's connection one time each second.
//
get_info = function() {
    setTimeout(get_received_info, 1000);
};

//
// Monitor the server to see if a partner connects or is already connected.
//
get_received_info = function() {
    reqwest({
        url: "/node/" + my_node_id + "/received_infos",
        method: 'get',
        type: 'json',
        success: function (resp) {
            if (resp.infos.length == 0) {
                get_info();
            } else {
                r = resp.infos[0].contents;
                int_list = JSON.parse(r);
                $("#title").text("Partner connected");
                $(".instructions").text("Press enter to begin");
                enter_lock = false;
            }

            // // Get training values
            // xTrain = data.x;
            // yTrain = data.y;

            // N = xTrain.length * 2;
            // $("#total-trials").html(N);
            // yTrainReported = [];

            // // Get test values.
            // // half are from training; the rest are new
            // allX = range(1, xMax);
            // xTestFromTraining = randomSubset(xTrain, N/4);
            // xTestNew = randomSubset(allX.diff(xTrain), N/4);
            // xTest = shuffle(xTestFromTraining.concat(xTestNew));
            // yTest = [];

        },
        error: function (err) {
            console.log(err);
            err_response = JSON.parse(err.response);
            $('body').html(err_response.html);
        }
    });
};

//
// Draw the user interface.
//
drawUserInterface = function () {

    paper = Raphael(0, 50, 800, 600);

    // Create the stimulus background.
    stimulus_background = paper.rect(stimulus_x_start,
                                     stimulus_y_start,
                                     stimulus_bg_width,
                                     stimulus_bg_height-2*inset);
    stimulus_background.attr("stroke", "#CCCCCC");
    stimulus_background.attr("stroke-dasharray", "--");

    // Draw the stimulus bar with the next line length in the list.
    stimulus_bar = paper.rect(stimulus_x_start,
                              stimulus_y_start-inset,
                              0,
                              25);
    stimulus_bar.attr("fill", stimulus_color);
    stimulus_bar.attr("stroke", "none");

};

//
// Move to next trial: Increment trial number, display stimulus, and allow response.
//
proceedToNextTrial = function () {

    // Prevent repeat keypresses.
    Mousetrap.pause();

    // Increment the trial and guess counter.
    trialIndex = trialIndex + 1;
    guessCounter = -1;
    $("#trial-number").html(trialIndex+1);

    // Print current trial.
    console.log('Trial: '+trialIndex)

    // Set up the stimuli.
    stimulus_background.show();
    stimulus_bar.attr({ width: int_list[trialIndex]*PPU });

    // Reveal stimulus for set amount of time.
    $("#title").text("Remember this line length.");
    $(".instructions").text("");
    stimulus_background.show();
    stimulus_bar.show();

    // Allow response only for a limited amount of time.
    var unresponsiveParticipant
    setTimeout(allowResponse,
               stimulus_timeout*1000);

    // nb: this needs to be moved to the training trail bit
    // Show partner's guess.
    setTimeout(getPartnerGuess,
               partner_timeout*1000);

    // If this is a training trial...
    if (trialIndex <= trainN) {

        // Update header for participant.
        $("training-or-testing").html("Training");
        $("total-trials").html(testN);

        // // Display correction.
        // showCorrectLength();

        // Move on to the next trial.
        clicked = false;

    // ... or if this is a test trial ...
    } else if (trialIndex > trainN && trialIndex <= testN) {

        // Update header for participant.
        $("training-or-testing").html("Testing");
        $("total-trials").html(testN);

        // // Show partner's guess.
        // setTimeout( function(){
        //   getPartnerGuess();
        // }, partner_timeout*1000);

        // Move on to the next trial.
        clicked = false;

    // ... or if we're done, finish up.
    } else {

        // Send data back to the server and proceed to questionnaire.
        $(document).off('click', mousedownEventListener);
        paper.remove();

    };
};

//
// For training trials, show the correct length.
//
showCorrectLength = function(){

  //


}

//
// Send the data back to the server.
//
sendDataToServer = function(){

        // Identify whether we're in training or testing.
        if (trialIndex <= trainN){
            trialType = "train";
            trialNumber = trialIndex
        } else {
            trialType = "test";
            trialNumber = trialIndex-trainN
        };

        // Prepare data to send to server.
        console.log('Accept Type: '+acceptType)
        console.log('Logged guess: '+response);
        trialData = JSON.stringify({"trialType": trialType,
                                    "trialNumber": trialNumber,
                                    "guessCounter": guessCounter,
                                    "length": int_list[trialIndex]*PPU,
                                    "guess": response,
                                    "acceptType": acceptType
                                  });

        // If we're at the last trial, proceed to questionnaire.
        if (trialIndex === testN){
            reqwest({
                url: "/info/" + my_node_id,
                method: 'post',
                data: {
                    contents: trialData,
                    info_type: "Info"
                }, success: function(resp) {
                    create_agent();
                }
            });

        // Otherwise, keep going with the estimation setup.
        } else {
            reqwest({
                url: "/info/" + my_node_id,
                method: 'post',
                data: {
                    contents: trialData,
                    info_type: "Info"
                }
            });
        };
}

//
// Allow user response only for a set number of seconds.
//
allowResponse = function() {

    // Hide stimulus bar.
    stimulus_bar.hide();
    stimulus_background.hide();

    // Create response background.
    response_background = paper.rect(response_x_start,
                                     response_y_start,
                                     response_bg_width,
                                     response_bg_height-2*inset);
    response_background.attr("stroke", "#CCCCCC");
    response_background.attr("stroke-dasharray", "--");

    // Draw response bar.
    response_bar = paper.rect(response_x_start,
                              response_y_start-inset,
                              response_bg_width,
                              response_bg_height);
    response_bar.attr("fill", own_guess_color);
    response_bar.attr("stroke", "none");

    // Display response bar and reset instructions.
    click_lock = false;
    $("#title").text("Re-create the line length.");
    $(".instructions").text("");
    response_background.show();
    response_bar.show();

    // Set the response variable to default and increment guess counter.
    acceptType = 0;
    guessCounter = guessCounter + 1;

    // Enable response.
    $(document).one('click', function(){
        mousedownEventListener();
    });

    // Track the mouse during response.
    $(document).mousemove( function(e) {
        x = e.pageX-response_x_start;
        response_bar_size = bounds(x, 1*PPU, xMax*PPU);
        response_bar.attr({ x: response_x_start,
                            width: response_bar_size
                          });
    });

    // Monitor for an unresponsive participant.
    unresponsiveParticipant = setTimeout(disableResponseAfterDelay,
                                         response_timeout*1000);

    // If they click to submit a response, clear the timeout and update the site text.
    $(document).one('click', acknowledgeGuess);
}

//
// Acknowledge participant guess.
//
function acknowledgeGuess(){

  // Stop the unresponsive timer and prevent multiple guesses.
  clearTimeout(unresponsiveParticipant);
  $(document).off('click', mousedownEventListener);

  // Update display text.
  $("#title").text("Your response has been recorded.");
  $(".instructions").text("Please wait for your partner's guess.");
}

//
// Disable participant responses if they take too long.
//
function disableResponseAfterDelay(){

  // Turn off click ability and event listeners.
  $(document).off('click');
  $(document).off('click', mousedownEventListener);
  $(document).off('click', acknowledgeGuess);

  // Update display text and hide response bars.
  $("#title").text("Reponse period timed out.");
  $(".instructions").text("Please wait for your partner's guess.");
  response_bar.hide();
  response_background.hide();

  // Log response as not having been given.
  response = -99;
  sendDataToServer();
}

//
// Listen for clicks and act accordingly.
//
function mousedownEventListener(event) {

    if (click_lock === false) {
        click_lock = true;

        // Track the mouse during response.
        $(document).mousemove( function(e) {
            x = e.pageX-response_x_start;
            response_bar_size = bounds(x, 1*PPU, xMax*PPU);
            response_bar.attr({ x: response_x_start, width: response_bar_size });
        });

        // Register response and hide bars.
        response = Math.round(response_bar_size/PPU);
        sendDataToServer();
        console.log('Mouse click: '+response);
        response_bar.hide();
        response_background.hide();

        // Stop the timer if we click.
        $(document).click(function(e) { e.stopPropagation(); });

        // Reset for next trial.
        Mousetrap.resume();
        click_lock = false;

        // // Training phase
        // if (trialIndex < N/2) {
        //     yTrue = yTrain[trialIndex];

        //     // if they are wrong show feedback
        //     yTrainReported.push(yNow);
        //     feedback.attr({ y: 400 - yTrue * PPU, height: yTrue * PPU });
        //     feedback.show();
        //     feedback.animate({fill: "#666"}, 100, "<", function () {
        //         this.animate({fill: "#CCC"}, 100, ">");
        //     });

        //     // Move on to next trial if response is correct.
        //     if(Math.abs(yNow - yTrue) < 4) {
        //         clicked = true;
        //         feedback.hide();
        //         stimulusX.hide();
        //         stimulusY.hide();
        //         Mousetrap.resume();
        //     }
        // // Testing phase
        // } else if (trialIndex <= N) {
        //     clicked = true;
        //     $("#training-or-testing").html("Testing");
        //     yTest.push(yNow);
        //     feedback.hide();
        //     stimulusX.hide();
        //     stimulusY.hide();
        //     Mousetrap.resume();
        // }
    };
}

//
// Check to see if partner has guessed one time per second.
//
waitForGuess = function() {
    setTimeout(getPartnerGuess, 1000);
};

//
// Monitor the server to see if partner has guessed.
//
getPartnerGuess = function() {

    reqwest({
        url: "/node/" + partner_node_id + "/infos",
        method: 'get',
        type: 'json',
        success: function (resp) {

            // Loop back if this is the first trial and the partner hasn't guessed.
            if (resp.infos.length == 0) {
              waitForGuess();
            } else {

              // Grab partner's guess.
              partner_guess_record = resp.infos[0].contents;
              partner_guess_trial = JSON.parse(partner_guess_record)["trialNumber"];

              // Loop back if the partner hasn't guessed on this trial.
              if (partner_guess_trial < trialIndex){

                waitForGuess();

              } else {

                // Go back until we find the partner's last guess on this trial.
                info_counter = 0;
                while (partner_guess_trial != trialIndex){
                  info_counter = info_counter + 1;
                  partner_guess_record = resp.infos[info_counter].contents;
                  partner_guess_trial = JSON.parse(partner_guess_record)["trialNumber"];
                }

                // Grab partner guess and move to display it.
                enter_lock = false;
                partner_x_guess = JSON.parse(partner_guess_record)["guess"];
                showPartner();
              }

            // // Get training values
            // xTrain = data.x;
            // yTrain = data.y;

            // N = xTrain.length * 2;
            // $("#total-trials").html(N);
            // yTrainReported = [];

            // // Get test values.
            // // half are from training; the rest are new
            // allX = range(1, xMax);
            // xTestFromTraining = randomSubset(xTrain, N/4);
            // xTestNew = randomSubset(allX.diff(xTrain), N/4);
            // xTest = shuffle(xTestFromTraining.concat(xTestNew));
            // yTest = [];
          }

        },
        error: function (err) {
            console.log(err);
            err_response = JSON.parse(err.response);
            $('body').html(err_response.html);
        }
    });
};


//
// Display partner's guess.
//
showPartner = function() {


  // Initialize buttons.
  change_guess_button = "<input type='button' id='changeGuess' value='Change my guess' style='position:absolute;top:"+change_guess_y+"px;left:"+stimulus_x_start+"px;'>"
  accept_partner_button = '<input type="button" id="partnerGuess" value="Accept partner\'s guess" style="position:absolute;top:'+accept_partner_y+'px;left:'+stimulus_x_start+'px;">'
  accept_own_button = "<input type='button' id='myGuess' value='Accept my guess' style='position:absolute;top:"+accept_own_y+"px;left:"+stimulus_x_start+"px;'>"

  // Handle timed-out responses by self or partner.
  if (partner_x_guess < 0 & response < 0) {

    // Update information text.
    $("#title").text("Neither you nor your parter submitted a guess in time");
    $(".instructions").text("Please submit a new guess");

    setTimeout(changeGuess,1000);

  } else if (partner_x_guess < 0) {

    // Update information text.
    $("#title").text("Your parter didn't submit a guess in time");
    $(".instructions").text("Would you like to accept your guess or submit a new guess?");

    // Draw response buttons.
    $("body").append(change_guess_button);
    $("body").append(accept_own_button);
    $("#changeGuess").click(changeGuess);
    $("#myGuess").click(acceptOwnGuess);

  } else if (response < 0) {

    // Display partner's guess.
    drawPartnerBar();

    // Update information text.
    $("#title").text("This is your partner's guess");
    $(".instructions").text("Would you like to accept their guess or submit a new guess?");

    // Draw response buttons.
    $("body").append(change_guess_button);
    $("body").append(accept_partner_button);
    $("#changeGuess").click(changeGuess);
    $("#partnerGuess").click(acceptPartnerGuess);

  } else {

    // Display partner's guess.
    drawPartnerBar();

    // Update information text.
    $("#title").text("This is your partner's guess");
    $(".instructions").text("Would you like to accept their guess, keep your guess, or change your guess?");

    // Draw response buttons.
    $("body").append(change_guess_button);
    $("body").append(accept_own_button);
    $("body").append(accept_partner_button);
    $("#changeGuess").click(changeGuess);
    $("#myGuess").click(acceptOwnGuess);
    $("#partnerGuess").click(acceptPartnerGuess);

  }
}

//
// Draw partner's guess.
//
drawPartnerBar = function(){

  // Draw partner's background.
  paper = Raphael(0, 50, 800, 600);
  partner_background = paper.rect(response_x_start,
                                  response_y_start+200,
                                  response_bg_width,
                                  response_bg_height-2*inset);
  partner_background.attr("stroke", "#CCCCCC");
  partner_background.attr("stroke-dasharray", "--");

  // Draw partner's guess.
  partner_bar = paper.rect(response_x_start,
                           response_y_start-inset+200,
                           response_bg_width,
                           response_bg_height);
  partner_bar.attr("fill", partner_guess_color);
  partner_bar.attr("stroke", "none");
  partner_bar.attr({x: response_x_start,
                    width: partner_x_guess*PPU
                    });
}


//
// Accept partner's guess.
//
acceptPartnerGuess = function() {

  // Remove partner's guesses and buttons.
  partner_background.hide();
  partner_bar.hide();
  $("#myGuess").remove();
  $("#partnerGuess").remove();
  $("#changeGuess").remove();

  // Reset text.
  $("#title").text("");
  $(".instructions").text("");

  // Note whose guess we accepted and send data.
  acceptType = 2;
  sendDataToServer();

  // Start next trial.
  proceedToNextTrial();

}

//
// Accept own guess.
//
acceptOwnGuess = function(){

  // Remove partner's guesses and buttons.
  partner_background.hide();
  partner_bar.hide();
  $("#myGuess").remove();
  $("#partnerGuess").remove();
  $("#changeGuess").remove();

  // Reset text.
  $("#title").text("");
  $(".instructions").text("");

  // Note whose guess we accepted and send data.
  acceptType = 1;
  sendDataToServer();

  // Start next trial.
  proceedToNextTrial();

}

//
// Change guess.
//
changeGuess = function(){

  // Remove partner's guesses and buttons.
  partner_background.hide();
  partner_bar.hide();
  $("#myGuess").remove();
  $("#partnerGuess").remove();
  $("#changeGuess").remove();

  // Reset text.
  $("#title").text("");
  $(".instructions").text("");

  // Open up to allow responses again.
  setTimeout(allowResponse,
             stimulus_timeout*1000);
  setTimeout(getPartnerGuess,
             partner_timeout*1000);

  // Note: Consider implementing a way to wait to display until the partner has also responded.

}

//
$(document).keydown(function(e) {
    var code = e.keyCode || e.which;
    if (code == 13) {
        if (enter_lock === false) {
            enter_lock = true;

            drawUserInterface();

            // If we're at the first trial, proceed directly to stimulus presentation.
            if (trialIndex === 0) {

                response_background.hide();
                response_bar.hide();
                proceedToNextTrial();

            // If this isn't our first trial, continue as normal.
            } else {
                proceedToNextTrial();
            }

            click_lock = false;
        }
    }
});
