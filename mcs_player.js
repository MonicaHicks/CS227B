//==============================================================================
// MCS
//==============================================================================

var manager = "manager";
var player = "rollthedice";

var role = "robot";
var ruleset = [];
var library = [];
var roles = [];
var state = [];

var startclock = 10;
var playclock = 10;

//===============================================================

function ping() {
  return "ready";
}

function start(r, rs, sc, pc) {
  role = r;
  ruleset = rs;
  library = definemorerules([], rs.slice(1)); // fixes rules
  roles = findroles(library); // array of all roles
  state = findinits(library);
  startclock = numberize(sc);
  playclock = numberize(pc);
  return "ready";
}

//===============================================================
// Main play function that returns next best move with maximax
//===============================================================
function play(move) {
  if (move !== nil) {
    state = simulate(move, state, library);
  }
  if (findcontrol(state, library) !== role) {
    return false;
  }
  // Use mcs
  return playmcs(role);
}

//===============================================================
// Play Monte-Carlo Search Player
//===============================================================
function playmcs() {
  var deadline = Date.now() + Math.floor(playclock - 3) * 1000;
  var actions = shuffle(findlegals(state, library));
  if (actions.length === 0) {
    return false;
  }
  if (actions.length == 1) {
    return actions[0];
  }
  var scores = [],
    visits = [],
    states = [];
  for (var i = 0; i < actions.length; i++) {
    states[i] = simulate(actions[i], state, library);
    scores[i] = 0;
    visits[i] = 0;
  }
  explore(states, scores, visits, deadline);
  return selectaction(actions, scores, visits);
}

//===============================================================
// Explore
//===============================================================
function explore(states, scores, visits, deadline) {
  var index = 0;
  while (Date.now() < deadline) {
    if (index >= states.length) {
      index = 0;
    }
    var result = depthcharge(states[index]);
    scores[index] = scores[index] + result;
    visits[index] = visits[index] + 1;
    index++;
  }
}

//===============================================================
// Depth Charge
//===============================================================
function depthcharge(state) {
  if (findterminalp(state, library)) {
    return findreward(role, state, library) * 1;
  }
  var actions = findlegals(state, library);
  if (actions.length === 0) {
    return 0;
  }
  var best = randomindex(actions.length);
  var newstate = simulate(actions[best], state, library);
  return depthcharge(newstate);
}

//===============================================================
// Select Actions
//===============================================================
function selectaction(actions, scores, visits) {
  var action = actions[0];
  var score = -1;
  // var probes = 0;
  for (var i = 0; i < actions.length; i++) {
    var newscore = Math.round(scores[i] / visits[i]);
    if (newscore == 100) {
      return actions[i];
    }
    if (newscore > score) {
      action = actions[i];
      score = newscore;
    }
  }
  return action;
}
