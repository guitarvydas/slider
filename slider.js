// Globals

const instructions = "Change slide contents here. Use return/enter after each line. Top line is heading.";
const aspect = screen.width / screen.height;

var presentation = null;
const example = [
    "Welcome to Slider\nA tiny presentation tool.",
    "First line is Title\nFollowing lines, body text.\nEverything centred.",
    "Simple Interface\nUpdate text in left panel...\nLive preview in right!"
];
var next = 1;
var current = 0; // Slide we're currently on.
var state = "edit"; // edit | show


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

function record() {
    // ( --) Record current presentation state into URL.
    
    history.pushState(presentation, "",
                      "#" + btoa(JSON.stringify(presentation)));
}

function flipping() {
    // ( --) Flip state.

    state = { edit: "show", show: "edit" }[state];
}

function jumping(delta) {
    // ( delta --) Move through presentation.

    let c = current + delta;
    if(c < 0) { c = 0 }
    else if(c >= presentation.length) { c = presentation.length - 1; }
    current = c;
    record();
}


// Mithril Components

function Slide() {
    function view(vnode) {
        return m("div.slide", {
            style: `aspect-ratio: ${aspect}; position: relative;` },
                 vnode.children,
                 m("div.absolute.bottom-30.left-0",
                   m("button.pad-1.dimmed", {
                       title: "Previous slide.",
                       onclick: (e) => jumping(-1) }, "<<"),
                   "show" === state && m("button.pad-1.dimmed", {
                       title: "Edit presentation.",
                       onclick: (e) => flipping()
                   }, "edit"),
                  ),
                 m("div.absolute.bottom-30.right-0", 
                   m("button.pad-1.dimmed", {
                       title: "Next slide.",
                       onclick: (e) => jumping(1) }, ">>"))
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
                     onfocus: (e) => { current = n; record(); },
                     oninput: (e) => vnode.attrs.updating(n, e.target.value) 
                 }, data));
    }
    
    return { view };
}


function Page() {        
    function upping(n) {
        // ( n --) Move current slide up, follow.

        let previous = n - 1;
        [presentation[previous], presentation[n]] =
            [presentation[n], presentation[previous]];
        current = previous;
    }

    function duping(n) {
        // ( n --) Duplicate slide n, jump to it.
        
        presentation.splice(n, 0, presentation[n]);
        current = n + 1;
    }
    
    function removing(n) {
        // ( n --) Remove slide n, jump to previous if needed.
        
        if(presentation.length > 1) { 
            presentation.splice(n, 1);
            if(undefined === presentation[current]) {
                jumping(current - 1);
            }
        }
    }
  
    function updating(n, text) {
        // ( n text --) Put new text into slide n.
        
        presentation[n] = text;
    }

    function oninit(vnode) {
        if(!presentation) {
            let incoming = document.location.hash;
            if(incoming && "#" === incoming[0]) {
                presentation = JSON.parse(
                    atob(incoming.slice(1)));
            } else {
                presentation = example;
            }
        }
    }

    
    function view(vnode) {
        return ["edit" === state && m("div.gui", 
                  m("div.sticky.top-0.flex.flex-col.gap-4px",
                    m("div", instructions),
                    m("div.flex.gap-1.justify-between",
                      m("button", {
                        title: "Click to add new slide.",
                        onclick: (e) => presentation.push([
                            "New Slide " + next++]) }, "+ slide"),
                      m("button", {
                          title: "Click to show presentation.",
                          onclick: (e) => flipping()
                      }, "show"),
                     )),
                  m("div.tray", 
                    presentation.map((data, n) => m(
                        Designer, { data, n, updating,
                                    upping, duping, removing }))),
                 ),
                m(Slides, { presentation })];
    }
    
    return { oninit, view };
}


m.mount(document.getElementById("content"), Page);
