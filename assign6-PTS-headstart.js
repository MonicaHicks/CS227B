//==============================================================================
// Persistent Tree Player
//==============================================================================

var manager = "manager";
var player = "rollthedice"; // <- your player name

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
  console.log("Player: Monica PTS");
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
  // HEADSTART
  var headstart_deadline = Date.now() + (startclock) * 1000;
  while (Date.now() < headstart_deadline) { process(tree) };
  // console.log("Starting node: ", tree);
  return "ready";
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

//===============================================================
// Play function that calls playalphabetaid
//===============================================================
function play(move) {
  if (move !== nil) {
    tree = subtree(move, tree);
    state = tree.state;
  }
  if (findcontrol(state, library) !== role) {
    return false;
  }
  var deadline = Date.now() + (playclock - 2) * 1000;
  while (Date.now() < deadline) { process(tree) };
  return selectaction(tree);
}

function process(node) {
  if (findterminalp(node.state, library)) {
    return true;
  }
  if (node.children.length === 0) {
    expand(node);
  } else {
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
  node.visits = node.visits + 1;
  //console.log("New node: ", node);
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

function stop(move) {
  return false;
}

function abort() {
  return false;
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
//==============================================================================

