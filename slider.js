// Globals

const instructions = "Change slide contents here. Use return/enter after each line. Top line is heading.";
const aspect = screen.width / screen.height;

var presentation = [
["Visualizing Text - Slider",
	"Handmade Jam #0004",
 "April 14-April 16, 2023"],
    [
"Existing Slide Software",
"Slide-making software already exists",
"But, they are behemoths",
	"* Powerpoint",
	"* Keynote",
	"* Obsidian",
	"* etc",
    ""
    ],
[
"Goal: Lightweight",
"* we want something lightweight",
"* like \"markdown\" for slides",
    "* but, less ad-hoc than markdown",
    "* The 'good parts' of heavyweights like Powerpoint and Keynote.",
    ""
],
    [
	"Technology",
	"Expect to use...",
"* Ohm-JS",
"* Mithril",
"* pushState() (as inspired by flems.io)",
	""
    ],
    [
	"Expected benefits",
	"beyond just making presentations...",
	"a lightweight, point-form visualizer for text might be used to create",
	"* README.mds",
	"* high-level documentation in general.",
	""
    ],
[
"Elements",
"* Title",
"* lines",
"* bullets",
    ""
],[
"Text Formatting",
"* italic",
"* bold",
    ""
],[
"Technologies",
"* Ohm-JS for pattern matching",
"* Ohm-JS / JavaScript for actions after pattern matching",
"* Mithril for formatting Webpage",
    ""
],[
"Lines of Code",
    "* Grammar: 12 lines",
    "* Actions: 15 lines",
    "* Mithril: 66 lines",
    ""
],[
"Github Repo",
"https://github.com/guitarvydas/slider",
    ""
],[
"Video",
"...",
    ""
],[
"Team",
"* Jos'h Fuller (oofoe)",
"* Paul Tarvydas (paultarvydas)",
    ""
],
    [
	"Appendix - Closing Thoughts",
	""
    ],
    [
	"Inspiration",
	""
    ],
    [
	"Did it turn out like we'd hoped?",
	"",
    ],
    [
	"What Did We Learn?",
	"",
    ],
    [
	"Bugs",
	"* need to save intermediate work to allow re-loading",
	"* italics?",
	""
    ],
    [
	"Future",
	""
    ],
    [
	"Appendix - Install / Build",
	"Nothing to build",
	"Open _index.html_ in a browser",
	"",
    ]
];
var next = 1;


// Ohm.js Grammar and Semantic Function Spec
    
const g2 = String.raw`Slide {
    slide = h1 body*
    body = ul | h2
    h1 = text nl
    ul = li+
    li = "*" sp text nl
    h2 = text nl?
    text = (~nl any)+
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
    text(chars) { return this.sourceString; }
});


// Mithril Components

function Slide() {
    function view(vnode) {
        return m("div.slide", {
            style: `aspect-ratio: ${aspect};` },
                 vnode.children);
     }
  
  return { view };
}

function Slides() {
    function view(vnode) {
        return m("div.slides", { },
                 vnode.attrs.presentation.map(
                     (x) => s(g.match(x.join("\n"))).m()));
    }

    return { view };
}

function Designer() {
  function view(vnode) {
    let n = vnode.attrs.n;
    let data = vnode.attrs.data;
    
    return m("div", 
      m("div.slide_controls",
        m("div", "Slide " + n),
        m("button", { 
          title: "Click to remove this slide.",
          onclick: (e) => vnode.attrs.removing(n) }, "x")),
      m("textarea", { 
        oninput: (e) => vnode.attrs.updating(n, e.target.value) 
      }, data.join("\n")));
  }
  
  return { view };
}

function Page() {
  function removing(n) {
    delete presentation[n];
  }
  
  function updating(n, text) {
    presentation[n] = text.split(/\n/)
  }
    
    function view(vnode) {
        return m("div.bed", { },
                 m("div.gui", { },
                   m("div.instructions", instructions),
                   presentation.map((data, n) => m(Designer, { data, n, updating, removing })),
                   m("button", {
                       title: "Click to add new slide.",
                       onclick: (e) => presentation.push([
                           "New Slide " + next++]) }, "+ slide")),
                 m(Slides, { presentation }),
                );
    }
    
    return { view };
}

m.mount(document.getElementById("content"), Page);
