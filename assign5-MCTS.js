//==============================================================================
// IN PROGRESS Monte Carlo Tree Search Player
//==============================================================================

var manager = "manager";
var player = "rollthedice"; // <- your player name
var player_type = "MCTS"

var role = "robot";
var ruleset = [];
var library = [];
var roles = [];
var state = [];
var tree = {};

var startclock = 10;
var playclock = 10;

var total_nodes = 0;

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
  // for persistent tree
  var reward = parseInt(findreward(role, state, library));
  tree = makenode(state, findcontrol(state, library), reward);
  return "ready";
}

function stop(move) {
  return false;
}

function abort() {
  return false;
}

function makenode(state, mover, reward) {
  total_nodes++;
  // console.log("Total nodes: ", total_nodes);
  return {
    state: state,
    actions: [],
    children: [],
    mover: mover,
    utility: reward,
    visits: 0,
  };
}

// 3 cases

//===============================================================
// Play function that calls MCTS
//===============================================================
function play(move) {
  if (move !== nil) {
    tree = subtree(move, tree);
    state = tree.state;
  }
  if (findcontrol(state, library) !== role) {
    return false;
  }
  return playMCTS(state);
  //var deadline = Date.now() + (playclock - 2) * 1000;
  //while (Date.now() < deadline) { process(tree) };
  //return selectaction(tree);
}

// Select -> Expand -> Simulate/Depthprobe -> Backprop
function playMCTS(state) {
  var deadline = Date.now() + Math.floor(playclock - 2) * 1000;
  while (Date.now() < deadline) { process(tree) };


  return selectaction(tree);

  // this code is from MCS for just making the next states for exploration
  // BUT PTS does that searching via the tree nodes
  /*var actions = shuffle(findlegals(state,library));
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
  return move;*/
}

//==============================================================================
// PTS RELATED FUNCTIONS
//==============================================================================
function process(node) {
  if (findterminalp(node.state, library)) {
    return true;
  }
  // if the node is unexpanded, expand
  if (node.children.length === 0) {
    expand(node);
    // then simulate MCS
    // pick an node, do depth charge, track playout
    var picknode = select(node);
    var result = depthcharge(picknode.state);
    // do something with the result
    // UCT on result??? 
    // bare minimum, backpropagate here after simulation
    //backpropagate(picknode, result);
    while (picknode != null) {
      picknode.visits++;
      picknode.reward += result;
      picknode = picknode.parent;
    }
  } else {
    // if already expanded, select the best node
    process(select(node));
  }
  update(node);
  return true;
}

function select(node) {
  var total = node.visits;
  var child = node.children[0];
  var score = value(child.utility, child.visits, total);
  for (var i = 1; i < node.children.length; i++) {
    var newchild = node.children[i];
    var newvalue = newchild.utility;
    var newvisits = newchild.visits;
    var newscore = value(newvalue, newvisits, total);
    if (newscore > score) {
      child = newchild;
      score = newscore;
    }
  }
  return child;
}

function expand(node) {
  node.actions = findlegals(node.state, library);
  for (var i = 0; i < node.actions.length; i++) {
    var newstate = simulate(node.actions[i], node.state, library);
    var newmover = findcontrol(newstate, library);
    var newscore = findreward(role, newstate, library) * 1;
    node.children[i] = makenode(newstate, newmover, newscore);
  }
  return true;
}

function update(node) {
  if (node.mover === role) {
    node.utility = scoremax(node);
  } else {
    node.utility = scoremin(node);
  }
  node.visits++; // counts up node visits as it 
  return true;
}

function scoremax(node) {
  var score = node.children[0].utility;
  for (var i = 1; i < node.children.length; i++) {
    var newscore = node.children[i].utility;
    if (newscore > score) {
      score = newscore;
    }
  }
  return score;
}

function scoremin(node) {
  var score = node.children[0].utility;
  for (var i = 1; i < node.children.length; i++) {
    var newscore = node.children[i].utility;
    if (newscore < score) {
      score = newscore;
    }
  }
  return score;
}

function selectaction(node) {
  var action = node.actions[0];
  var score = node.children[0].utility;
  for (var i = 1; i < node.children.length; i++) {
    var newscore = node.children[i].utility;
    if (newscore > score) {
      action = node.actions[i];
      score = newscore;
    }
  }
  return action;
}

function subtree(move, node) {
  if (node.children.length === 0) {
    expand(node);
  }
  for (var i = 0; i < node.actions.length; i++) {
    if (equalp(move, node.actions[i])) {
      return node.children[i];
    }
  }
  return node;
}

function selectnode(node) {
  var child = node.children[0];
  var visits = node.children[0].visits;
  for (var i = 0; i < node.children.length; i++) {
    var newvisits = node.children[i].visits;
    if (newvisits < visits) {
      child = node.children[i];
      visits = newvisits;
    }
  }
  return child;
}

function value(utility, visits, total) {
  //var score = utility + Math.round((1 - visits / total) * 100);
  var C = 60;
  var explore = Math.round(utility / visits);
  var exploration = C * Math.sqrt((Math.log(total))/ visits);
  var score = explore + exploration;
  return score;
}

function backpropagate(node, reward) {
  node.visits++;
  node.value += reward;
  if (node.parent) {
    backpropagate(node.parent, reward);
  }
}

//==============================================================================
// MCS RELATED FUNCTIONS
//==============================================================================
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
  // DOES NO PROBES AND ERRORS OUT*****************
  console.log("Probes: ", probes);
  return action;
}

function randomindex(numactions) {
  return Math.floor(Math.random() * (numactions));
}

//===============================================================
// Evaluation functions:
// Intermediate reward evaluation function (returns actual reward in all states)
// Mobility/focus functions (your mobility, limiting opponent mobility)
//===============================================================
function evalWeights(state) {
  if (roles.length > 1) {
    return (1 * intermediateEval(state, library)); // + (0.2 * mobility(state, library))
  }
  return (0.7 * intermediateEval(state, library)) + (0.3 * pessimistic(state, library));
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
// Shuffle function
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
//==============================================================================

