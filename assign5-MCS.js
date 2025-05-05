//==============================================================================
// IN PROGRESS Monte Carlo Player
//==============================================================================
var player_type = "MCS"

var manager = "manager";
var player = "rollthedice"; // <- your player name

var role = "robot";
var ruleset = [];
var library = [];
var roles = [];
var state = [];

var startclock = 10;
var playclock = 10;

//===============================================================

function ping() {
  console.log("Player Type: ", player_type);
  return "ready";
}
  
function start(r, rs, sc, pc) {
  role = r;
  ruleset = rs;
  library = definemorerules([], rs.slice(1));
  roles = findroles(library);
  state = findinits(library);
  startclock = numberize(sc);
  playclock = numberize(pc);
  return "ready";
}

//===============================================================
// Play function that calls MCS
//===============================================================
function play(move) {
  if (move !== nil) {
    state = simulate(move, state, library);
  }
  if (findcontrol(state, library) !== role) {
    return false;
  }
  return playMCS(state);
}

//===============================================================
// Play Monte-Carlo Search Player
//===============================================================
function playMCS(state) {
  var deadline = Date.now() + Math.floor(playclock - 2) * 1000;
  var actions = shuffle(findlegals(state,library));
  if (actions.length === 0) { return false };
  if (actions.length === 1) { return actions[0] };

  var states = [];
  var scores = [];
  var visits = [];
  for (var i = 0; i < actions.length; i++) {
    states[i] = simulate(actions[i], state, library);
    scores[i] = 0;
    visits[i] = 0;
  }
  explore(states, scores, visits, deadline);
  var move = selectaction(actions, scores, visits);
  // can insert print of move here for debugging
  return move;
}

//===============================================================
// Explore
//===============================================================
function explore (states, scores, visits, deadline) {
  var index = 0;
  var depthcharges = 0;
  while (Date.now() < deadline) {
    if (index >= states.length) { index = 0 };
    var result = depthcharge(states[index]);
    scores[index] = scores[index] + result;
    visits[index] = visits[index] + 1;
    depthcharges++; 
    index++;
  }
  console.log("State index: ", index);
  console.log("Depthcharges: ", depthcharges);
  return true;
}

//===============================================================
// Depth Charge
//===============================================================
function depthcharge (state) {
  if (findterminalp(state,library)) {
    return findreward(role,state,library)*1;
  }

  var actions = findlegals(state,library);
  if (actions.length === 0) { return 0 };

  // pick random next action, recursively call
  var best = randomindex(actions.length);
  var newstate = simulate(actions[best], state, library);
  return depthcharge(newstate);
}

//===============================================================
// Select Actions
//===============================================================
function selectaction (actions, scores, visits) {
  var action = actions[0];
  var score = -1;
  var probes = 0;
  for (var i=0; i < actions.length; i++) {
    // average the score over num of visits to eval
    var newscore = Math.round(scores[i]/visits[i]);
    if (newscore === 100) { return actions[i] };
    if (newscore > score) {
      action = actions[i];
      score = newscore;
      probes = visits[i];
    }
  }
  // console.log("Score: ", score);
  console.log("Probes: ", probes);
  return action;
}

function randomindex(numactions) {
  return Math.floor(Math.random() * (numactions));
}

//===============================================================
// shuffle function
//===============================================================
function shuffle(actions) {
  for (var i = actions.length - 1; i > 0; i--) {
    // https://www.geeksforgeeks.org/how-to-shuffle-an-array-using-javascript/
    var idx = Math.floor(Math.random() * (i + 1));
    var temp = actions[i];
    actions[i] = actions[idx];
    actions[idx] = temp;
  }
  return actions;
}
    
//===============================================================

function stop(move) {
  return false;
}

function abort() {
  return false;
}