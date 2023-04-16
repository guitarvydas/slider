// Globals

const instructions = "Change slide contents here. Use return/enter after each line. Top line is heading.";
const aspect = screen.width / screen.height;

var presentation = [
    "Welcome to Slider\nA tiny presentation tool.",
    "First line is Title\nFollowing lines, body text.\nEverything centred.",
    "Simple Interface\nUpdate text in left panel...\nLive preview in right!"
];
var next = 1;
var current = 0; // Slide we're currently on.


// Ohm.js Grammar and Semantic Function Spec
    
const g2 = String.raw`
Slide {
    slide = h1 body*
    body = ul | h2
    h1 = line nl?
    ul = li+
    li = "*" sp line nl?
    h2 = line nl?
    line = (i | b | text)+
    i = "__" (~(nl | "__") any)+ "__"
    b = "*" (~(nl | "*") any)+ "*"
    text = (~(nl | "__" | "*") any)+
    sp = (" " | "	")+
    nl = "\r"? "\n"
}
`;
const g = ohm.grammar(g2);

const s = g.createSemantics();
s.addOperation("m", { // Generate Mithril nodes.
    _iter(...children) {
        return children.map(c => c.m());
    },
    _terminal() { return this.sourceString; },

    slide(h1, body) { return m(Slide, h1.m(), body.m()); },
    body(line) { return line.m(); },
    h1(text, nl) { return m("h1", text.m()); },
    ul(li) { return m("ul", li.m()); },
    li(bullet, space, text, nl) { return m("li", text.m()); },
    h2(text, nl) { return m("h2", text.m()); },
    b(_1, text, _2) { return m("b", text.m()); },
    i(_1, text, _2) { return m("i", text.m()); },
    text(chars) { return this.sourceString; }
});


// Global Actions

function jumping(delta) {
    // ( delta --) Move through presentation.

    let c = current + delta;
    if(c < 0) { c = 0 }
    else if(c >= presentation.length) { c = presentation.length - 1; }
    current = c;
}


// Mithril Components

function Slide() {
    function view(vnode) {
        return m("div.slide", {
            style: `aspect-ratio: ${aspect}; position: relative;` },
                 vnode.children,
                 m("div", { style: "position: absolute; left: 0; bottom: 30%;" },
                   m("button.dimmed", { style: "padding: 1pc;", onclick: (e) => jumping(-1) }, "<<"),
                   m("button.dimmed", { style: "padding: 1pc;" }, "edit"),
                  ),
                 m("div", { style: "position: absolute; right: 0; bottom: 30%"},
                   m("button.dimmed", { style: "padding: 1pc;", onclick: (e) => jumping(1) }, ">>"))
                );
     }
  
  return { view };
}

function Slides() {
    function view(vnode) {
        return m("div.slides", { },
                 s(g.match(presentation[current])).m());
    }

    return { view };
}

function Designer() {
    function view(vnode) {
        let n = vnode.attrs.n;
        let data = vnode.attrs.data;
        
        return m("div", 
                 m("div.slide_controls" + (current === n ? ".slide_current" : ""),
                   m("div", "Slide " + n),
                   m("div",
                     n != 0 && m("button.dimmed", {
                         title: "Move this slide up.",
                         onclick: (e) => vnode.attrs.upping(n) },`\u{21d1}`),
                     m("button.dimmed", {
                         title: "Duplicate this slide.",
                         onclick: (e) => vnode.attrs.duping(n) }, `+`),
                     m("button.danger.dimmed", { 
                         title: "Delete this slide.",
                         onclick: (e) => vnode.attrs.removing(n) }, "x"))),
                 m("textarea", {
                     style: `aspect-ratio: ${aspect};`,
                     onfocus: (e) => current = n,
                     oninput: (e) => vnode.attrs.updating(n, e.target.value) 
                 }, data));
    }
    
    return { view };
}


function Load() {
    function view() {
    }

    return { view } 
}


function Edit() {
    function upping(n) {
        console.log("-- upping()");
        [presentation[n-1], presentation[n]] =
            [presentation[n], presentation[n-1]];
    }

    function duping(n) {
        presentation.splice(n, 0, presentation[n]);
    }
    
  function removing(n) { delete presentation[n]; }
  
  function updating(n, text) {
      presentation[n] = text;
  }
    
    function view(vnode) {
        return [m("div.gui", 
                  m("div.instructions", instructions,
                    m("div.flex",
                      m("button", {
                        title: "Click to add new slide.",
                        onclick: (e) => presentation.push([
                            "New Slide " + next++]) }, "+ slide"),
                      m("button", {
                          title: "Click to play presentation.",
                          onclick: (e) => document.location = "#!/show"
                      }, "play"))),
                  m("div.tray", 
                    presentation.map((data, n) => m(
                        Designer, { data, n, updating,
                                    upping, duping, removing }))),
                 ),
                m(Slides, { presentation })];
    }
    
    return { view };
}


function Show() {
    function view(vnode) { return m(Slides, { presentation }); }

    return { view }
}


// m.mount(document.getElementById("content"), Page);
m.route(document.getElementById("content"), "/edit", {
    "/load": Load,
    "/edit": Edit,
    "/show": Show
})
