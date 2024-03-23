/******************************************************************************
 * globals routines
 ******************************************************************************/
var words=[];

var userName=null;

var colour = ["", "rgba(75, 75, 75, 0.6)", "rgba(253, 183, 49, 0.6)", "rgba(94, 255, 94, 0.6)"];

gui_state = {
	row: 0,
	col: 0,
	guess: [], 
	alphabetMap: getAlphabetMap(),
};

function gui_resetGame(){
	gui_state.row=0;
	gui_state.col=0;
	gui_state.guess=[];
	gui_state.alphabetMap=getAlphabetMap();
}

function getAlphabetMap() {
    return {
        'Q': '.Q','W': '.W','E': '.E', 'R': '.R','T': '.T','Y': '.Y',
		'U': '.U','I': '.I','O': '.O','P': '.P','A': '.A','S': '.S',
		'D': '.D','F': '.F','G': '.G','H': '.H','J': '.J','K': '.K',
		'L': '.L','Z': '.Z','X': '.X','C': '.C','V': '.V','B': '.B',
		'N': '.N','M': '.M','DEL': '.DEL','ENTER': '.ENTER'
    };
}

/******************************************************************************
 * gui utilities
 ******************************************************************************/

// manage the userinterface, we show the specified user interface
// and also change the class of the nav so that the selected element is
// highlighted in green
function showUI(ui){
	// switch ui
	$(".ui_top").hide();
	$(ui).show();
	// change icon colour to green
	$("nav a span").removeClass("nav_selected");
    $("nav a[name='" + ui.replace("#","") + "'] span").addClass("nav_selected");
}

/******************************************************************************
 * gui utilities: coloring the letters depending on the guess score
 ******************************************************************************/

// As a result of the latest guess, update the colours of the game board
// and keyboard.
function colourBoardAndKeyboard(score){
	//Board and Keyboard
	for (let i=0; i<score.length; i++){
		let cell = $(".row" + gui_state.row + ">" +  ".col" + i);
		let key = $(getAlphabetMap()[score[i]["char"]]);
		let scoreVal = score[i]["score"];
        cell.css("background-color", colour[scoreVal]);
        key.css("background-color", colour[scoreVal]);
	}
}

function resetColour(){
	$(".letterbox td, .keyboardrow td").css("background-color", "");
	$(".letterbox td").text("");
}

/******************************************************************************
 * gui utilities: handling virtual keyboard events
 ******************************************************************************/

// #ui_play delete the last character from the current board row
function delCharacter(){
	if(gui_state.guess.length > 0){
		gui_state.col--; // do substraction first
		var cell = $(".row" + gui_state.row + " .col" + gui_state.col);
		cell.text("");
		gui_state.guess.pop();
	}
}

// #ui_play put character c at the end of the current board row
function putCharacter(c){
	if (c === 'DEL') {  //delete
        delCharacter();
    } else if (c === 'ENTER'){ 			//enter 
        gui_guess(gui_state.guess.join(""));
	} else{
		if(gui_state.guess.length < 5){
			var cell = $(".row" + gui_state.row + " .col" + gui_state.col);
			cell.text(c);
			gui_state.col++;
			gui_state.guess.push(c);
		}
	}
}


/******************************************************************************
 * gui routines
 ******************************************************************************/

// #ui_play update the model with a guess, and then modify the gui appropriately
function gui_guess(guess){
	$.ajax({
		method: "PUT",
		url: "/api/wordle/guess/",
		data: JSON.stringify({"guess": guess, "userName" : userName}),
		processData:false,
		contentType: "application/json; charset=utf-8",
		dataType:"json"
	}).done(function(data, text_status, jqXHR){
		console.log(jqXHR.status+" "+text_status + JSON.stringify(data));
		var resData = data.data;
		if(resData["success"]){
			colourBoardAndKeyboard(resData["score"])
			gui_state.state = resData["state"]
			gui_state.row++;
			gui_state.col = 0;
			gui_state.guess = [];
	
			if(gui_state.state === "won" || gui_state.state === "lost"){
				gui_gameDisable();
				$(".won").text(data.won);
				$(".lost").text(data.lost);
			}
		}
		//error message 
		else{
			showError(data.data.error);
		}
	}).fail(function(err){
		console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
	});
	//console.log(guess);
	//wordle.state = "play";
}

function showError(error) {
    $('#error').text(error).fadeIn("slow");
    $(".error").on("click", () => $('#error').fadeOut());
    setTimeout(() => $('#error').fadeOut("slow"), 6000);
}


// #ui_play: hide the play button and enable the onscreen keyboard
function gui_gameEnable(){
	$("#play_newgame_button").hide();
	$(".keyboardrow td").on("click", function() {
        var character = $(this).text();
        putCharacter(character); 
		// console.log(gui_state);
    });
}

// #ui_play: show the play button and disable the onscreen keyboard
function gui_gameDisable(){
	$("#play_newgame_button").show();
	$(".keyboardrow td").off("click");
}

// #ui_play: reset the state of the game in the model and gui_state, clear the game from #ui_play
function gui_newgame(){
	//console.log(userName);
	$.ajax({
		method: "PUT",
		url: "/api/wordle/newgame/",
		data: JSON.stringify({"userName" : userName}),
		processData:false,
		contentType: "application/json; charset=utf-8",
		dataType:"json"
	}).done(function(data, text_status, jqXHR){
		console.log(jqXHR.status+" "+text_status + JSON.stringify(data));
		gui_resetGame();
		// need to reset board and keyboard
		resetColour();
		gui_gameEnable();
	}).fail(function(err){
		console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
	});
}


/******************************************************************************
 * onload 
 ******************************************************************************/
$(function(){
	$.ajax({
		url: "/api/wordle/words/",
		method: 'GET',
	}).done(function(data, text_status, jqXHR){
		words = data.split("\n");
		//console.log(words)
		$.ajax({
			method: "POST",
			url: "/api/wordle/userName/",
			processData:false,
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify({"words": words}),
			dataType:"json"
		}).done(function(data, text_status, jqXHR){
			console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
			userName = data.userName;
			$("#username").html(userName);
			gui_gameDisable();
			showUI("#ui_username");
		}).fail(function(err){
			console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
		});
	}).fail(function(err) {
		console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
		return;
	});
	
});

