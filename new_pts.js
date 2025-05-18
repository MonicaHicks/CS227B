var manager = "manager";
var player = "rollthedice";

var role = "robot";
var ruleset = [];
var library = [];
var roles = [];
var state = [];
var tree = {}; // set initial persistent tree

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

  // make node of current game state
  tree = makenode(
    state,
    findcontrol(state, library),
    findreward(role, state, library) * 1
  );
  return "ready";
}

// make a new node
function makenode(state, mover, reward) {
  return {
    state: state,
    actions: [],
    children: [],
    mover: mover,
    utility: reward,
  };
}
