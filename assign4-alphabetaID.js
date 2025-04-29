//==============================================================================
// Alpha-Beta Iterative Deepening Player
//==============================================================================

var manager = "manager";
var player = "rollthedice"; // <- your player name

var role = "robot";
var ruleset = [];
var library = [];
var roles = [];
var state = [];

var startclock = 10;
var playclock = 10;

// Set the max search depth for the minimax search
//var MAX_DEPTH = 3; // can hange but 3 works well imo

//===============================================================

function ping() {
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
// Play function that calls playalphabetaid
//===============================================================
function play(move) {
  if (move !== nil) {
    state = simulate(move, state, library);
  }
  if (findcontrol(state, library) !== role) {
    return false;
  }
  return play_alpha_beta_id(state);
}

//===============================================================
// Updated play function that uses alpha beta and iterative
// deepening.
//===============================================================

function play_alpha_beta_id(state) {
  var deadline = Date.now() + (playclock - 1) * 1000;
  var best = findlegalx(state, library);
  for (var depth = 1; depth < 10; depth++) {
    var action = play_alpha_beta_id_inner(state, role, 0, 100, depth, deadline);
    if (action === false) {
      return best;
    }
    best = action;
  }
  return best;
}

//===============================================================
// Finds best action by evaluating future rewards via iterative
// deepening alpha beta
//===============================================================
function play_alpha_beta_id_inner(state, role, alpha, beta, depth, deadline) {
  var actions = shuffle(findlegals(state, library));
  if (actions.length === 0) {
    return false;
  }
  if (actions.length === 1) {
    return actions[0];
  }
  var bestAction = actions[0];
  var bestScore = 0;

  for (var i = 0; i < actions.length; i++) {
    var newState = simulate(actions[i], state, library);
    var result = alphabeta_bounded_id(
      newState,
      role,
      alpha,
      beta,
      depth,
      deadline
    );
    if (result === false) {
      return false;
    }
    if (result === 100) {
      return actions[i];
    } // early return for winning move
    if (result > bestScore) {
      bestScore = result;
      bestAction = actions[i];
    }
  }
  return bestAction;
}

//===============================================================
// Alpha-beta search with bounded depth iterative deepening
//===============================================================
function alphabeta_bounded_id(state, role, alpha, beta, depth, deadline) {
  if (findterminalp(state, library)) {
    return findreward(role, state, library) * 1;
  }
  if (depth <= 0) {
    return intermediateEval(state, library); // USES INTERMEDIATE REWARD HERE
  }
  if (Date.now() > deadline) {
    return false;
  }
  var active = findcontrol(state, library);
  if (active === role) {
    return maximize_bounded_id(state, role, alpha, beta, depth - 1, deadline);
  }
  return minimize_bounded_id(state, role, alpha, beta, depth - 1, deadline);
}

//===============================================================
// Iterative deepening maximize bounded
//===============================================================
function maximize_bounded_id(state, role, alpha, beta, depth, deadline) {
  var actions = findlegals(state, library);
  if (actions.length === 0) {
    return 0;
  }
  var score = 0;
  for (var i = 0; i < actions.length; i++) {
    var newstate = simulate(actions[i], state, library);
    var newscore = alphabeta_bounded_id(
      newstate,
      role,
      alpha,
      beta,
      depth,
      deadline
    );
    if (newscore === 100) {
      return 100;
    }
    if (newscore === false) {
      return false;
    }
    if (newscore > score) {
      score = newscore;
    }
    if (score >= beta) {
      break;
    }
    alpha = Math.max(alpha, score);
  }
  return score;
}

//===============================================================
// Iterative deepening minimize bounded
//===============================================================
function minimize_bounded_id(state, role, alpha, beta, depth, deadline) {
  var actions = findlegals(state, library);
  if (actions.length === 0) {
    return 0;
  }
  var score = 100;
  for (var i = 0; i < actions.length; i++) {
    var newstate = simulate(actions[i], state, library);
    var newscore = alphabeta_bounded_id(
      newstate,
      role,
      alpha,
      beta,
      depth,
      deadline
    );
    if (newscore === false) {
      return false;
    }
    if (newscore === 0) {
      return 0;
    }
    if (newscore < score) {
      score = newscore;
    }
    if (score <= alpha) {
      break;
    }
    beta = Math.min(beta, score);
  }
  return score;
}

//===============================================================
// Evaluation functions:
// Intermediate reward evaluation function (returns actual reward in all states)
// Mobility/focus functions (your mobility, limiting opponent mobility)
//===============================================================
function evalWeights(state) {
    return (0.7 * intermediateEval(state, library)) + (0.3 * mobility(state));
}

function intermediateEval(state, library) {
  return findreward(role, state, library) * 1;
}

function mobility(state) {
  var actions = findlegals(state,library);
  var feasibles = findactions(library);
  return (actions.length/feasibles.length * 100);
}

function focus(state) {
  var actions = findlegals(state,library);
  var feasibles = findactions(library);
  return (100 - (actions.length/feasibles.length * 100));
}

function pessimistic(state, library) {
  if (findterminalp(state, library)) {
    return findreward(role, state, library) * 1;
  }
  return 0;
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