var manager = "manager";
var player = "rollthedice";

var role = "robot";
var ruleset = [];
var library = [];
var roles = [];
var state = [];
var tree = {}; // set initial persistent tree
var total_nodes = 0;
var BF = 0; // branch factor for BS
var MD = 0; // max depth for BS
var IR = 0; // intermediate reward for BS

var startclock = 10;
var playclock = 10;

// set global var
function start(r, rs, sc, pc) {
  role = r;
  library = definemorerules([], rs.slice(1));
  roles = findroles(library);
  state = findinits(library);
  startclock = parseInt(sc);
  playclock = parseInt(pc);
  var bigswitch_deadline = Date.now() + (startclock - 5) * 1000;
  bigswitch(bigswitch_deadline);

  // make node of current game state
  tree = makenode(
    state,
    findcontrol(state, library),
    findreward(role, state, library) * 1
  );
  return "ready";
}

// big switch
function bigswitch(softdeadline) {
  while (Date.now() < softdeadline) {
    info = makeinfo();
    info = modified_depthcharge(info, state);
    BF = Math.max(BF, info.branchfactor);
    MD = Math.max(MD, info.maxdepth);
    if (MD > 0) {
      // prevent divide by zero
      IR = Math.max(IR, IR / MD);
    }
  }
  var text =
    "branch factor: " +
    BF.toString() +
    " max depth: " +
    MD.toString() +
    " intermediate ratio: " +
    IR.toString();
  write(text);
}

function modified_depthcharge(info, mdc_state) {
  if (findterminalp(mdc_state, library)) {
    return info;
  }
  actions = shuffle(findlegals(mdc_state, library));
  info.branchfactor = Math.max(info.branchfactor, actions.length);
  info.maxdepth++;
  // accumulate intermediate rewards and divide later
  info.intermediatereward =
    info.intermediatereward + findreward(role, mdc_state, library) * 1;
  if (actions.length > 0) {
    var newstate = simulate(actions[0], mdc_state, library);
    modified_depthcharge(info, newstate);
  }
  return info;
}

function makeinfo() {
  return { branchfactor: 0, maxdepth: 0, intermediatereward: 0 };
}

function ping() {
  return "ready";
}

// make a new node
function makenode(state, mover, reward) {
  total_nodes++;
  return {
    state: state,
    actions: [],
    children: [],
    mover: mover,
    utility: reward,
  };
}

// play PTS
function play(move) {
  // update tree to the subtree of action chosen
  if (move !== nil) {
    tree = subtree(move, tree);
    state = tree.state;
  }

  if (findcontrol(state, library) !== role) {
    return false;
  }

  var deadline = Date.now() + (playclock - 2) * 1000;

  while (Date.now() < deadline) {
    process(tree);
  }
  return selectaction(tree);
}

// subtree returns the subtree corresponding
// to the move
function subtree(move, node) {
  if (node.children && node.children.length === 0) {
    expand(node);
  }

  for (var i = 0; i < node.actions.length; i++) {
    if (equalp(move, node.actions[i])) {
      return node.children[i];
    }
  }
  return node;
}

// process expands children or processes tree
function process(node) {
  if (findterminalp(node.state, library)) {
    // I feel like we add a reward return here
    return true;
  }

  // expand children
  if (node.children.length === 0) {
    expand(node);
  }
  // if expanded, explore
  else {
    process(select(node));
  }
}

// selectaction returns the child with the
// highest utility
function selectaction(node) {
  if (node.actions.length === 0 || node.children.length === 0) {
    return node;
  }
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

// select returns the subnode with the
// highest utility
function select(node) {
  // var total = node.visits;
  if (node.children.length < 1) {
    return node;
  }
  var child = node.children[0];
  var score = child.utility;
  for (var i = 0; i < node.children.length; i++) {
    var newchild = node.children[i];
    var newscore = newchild.utility;
    if (newscore > score) {
      child = newchild;
      score = newscore;
    }
  }
  return child;
}

// expand creates children nodes for a node
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

// modified for efficiency
function shuffle(actions) {
  for (var i = actions.length - 1; i > 0; i -= 2) {
    // https://www.geeksforgeeks.org/how-to-shuffle-an-array-using-javascript/
    var idx = Math.floor(Math.random() * (i + 1));
    var temp = actions[i];
    actions[i] = actions[idx];
    actions[idx] = temp;
  }
  return actions;
}

function write(text) {
  document.getElementById("transcript").textContent = text;
  // elem.innerHTML = elem.innerHTML + text;
}
