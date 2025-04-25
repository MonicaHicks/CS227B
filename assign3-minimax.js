//==============================================================================
// The code below defines a basic legal player.
// Steps to customize:
// (1) Replace our definitions of ping, start, play, stop, abort with your code.
// (2) Be sure to set the variable 'player' to your player's id.
// (3) Also change the value in the 'Identifier' field in the HTML below.
//==============================================================================

//===============================================================
// Single Player Minimax Player
//===============================================================

var manager = 'manager';
var player = 'minimax_player'; // <- replace w player name

var role = 'robot';
var ruleset = [];
var library = [];
var roles = [];
var state = [];

var startclock = 10;
var playclock = 10;

//===============================================================

function ping() {
  return 'ready';
}

function start(r, rs, sc, pc) {
  role = r;
  ruleset = rs;
  library = definemorerules([], rs.slice(1)); // fixes rules
  roles = findroles(library);
  state = findinits(library);
  startclock = numberize(sc);
  playclock = numberize(pc);
  return 'ready';
}

//===============================================================
// Main play function that returns best move using minimax
//===============================================================
function play(move) {
  if (move !== nil) {
    state = simulate(move, state, library);
  }

  if (findcontrol(state, library) !== role) {
    return false;
  }

  return bestmove(state);
}

//===============================================================
// Finds best action by evaluating future rewards via minimax()
//===============================================================
function bestmove(state) {
  var actions = findlegals(state, library);
  if ( actions.length === 0 ) { return false };
  if ( actions.length === 1 ) { return actions[0] };
  var bestAction = actions[0];
  var bestScore = 0;

  for (var i = 0; i < actions.length; i++) {
    var newState = simulate(actions[i], state, library);
    var result = minimax(newState);

    if (result === 100) {
      return actions[i]; // early return
    }
    if (result > bestScore) {
      bestScore = result;
      bestAction = actions[i];
    }
  }
  return bestAction;
}

//===============================================================
// Minimax calls maximize and minimize, which recursively call 
// minimax() to determine the respective reward to determine actions
//===============================================================
function minimax (state, role) {
  if (findterminalp(state,library)) {return findreward(role,state,library)*1};
  var active = findcontrol(state,library);
  if (active===role) {
    return maximize(state, role);
  }
 return minimize(state, role);
}

function maximize (state, role) {
  var actions = findlegals(state,library);
  if (actions.length===0) {return 0};
  var score = 0;
  for (var i=0; i<actions.length; i++) {
    var newstate = simulate(actions[i],state,library);
    var newscore = minimax(newstate, role);
    if (newscore===100) {return 100};
    if (newscore>score) {score = newscore}};
return score;
}

// opponent is trying to minimize, if the score is 0 then no need to continue
function minimize (state, role) {
  var actions = findlegals(state,library);
  if (actions.length===0) {return 0};
  var score = 100;
  for (var i=0; i<actions.length; i++) {
    var newstate = simulate(actions[i],state,library);
    var newscore = minimax(newstate, role);
    if (newscore===0) {return 0};
    if (newscore<score) {score = newscore}};
return score;
}

//===============================================================

function stop(move) {
  return false;
}

function abort() {
  return false;
}


