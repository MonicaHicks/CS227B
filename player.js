//==============================================================================
// Maximax player
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

//var bestScore = 0; // these are stored as globals to refer to past moves, TBD
//var bestAction;

// some globals for debugging
var nodes = 0;
var terminals = 0;

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
  // Use maximax to play next best move
  return playmaximax(state);
}

//===============================================================
// Finds best action by evaluating future rewards via maximax
//===============================================================
function playmaximax(state) {
  var actions = findlegals(state, library);
  if (actions.length === 0) return false;
  if (actions.length === 1) return actions[0];
  return maximax(state).move;
}

//===============================================================
// Maximax: assume each player maximizes their own score
//===============================================================
function maximax(state) {
  //nodes = nodes + 1;
  // Base case: terminal state, return its reward vector
  if (findterminalp(state, library)) {
    //terminals = terminals + 1;
    let termvector = {};
    for (let i = 0; i < roles.length; i++) {
      termvector[roles[i]] = findreward(roles[i], state, library);
    }
    return { score: termvector, move: null };
  }

  var active = findcontrol(state, library); // The current player
  var actions = findlegals(state, library); // Legal actions for this player

  var bestScore = -Infinity; // starting to adapt a bit of alpha-beta thinking...
  var bestAction = actions[0];
  var bestVector = {};
  for (var j = 0; j < roles.length; j++) {
    bestVector[roles[j]] = -1;
  }

  for (let i = 0; i < actions.length; i++) {
    let newstate = simulate(actions[i], state, library);
    let result = maximax(newstate);
    let myScore = result.score[active];

    if (myScore > bestScore) {
      bestScore = myScore;
      bestAction = actions[i];
      bestVector = result.score;
    }
  }
  return { score: bestVector, move: bestAction };
}

function pessimistic() {
  if (findterminalp(state, library)) {
    return findreward(findcontrol(state, library), state, library);
  }
  return 0;
}
