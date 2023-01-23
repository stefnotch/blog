# CSS8

> _Optimally combining HTML5 and CSS3._

The guiding philosophy behind the algorithm is: _No selector left behind_

TODO: Make this real using clingo-wasm and https://github.com/leaverou/parsel

```
% Clingo
% node IDs
nodeCount(3).
node(0..ID) :- ID = NC - 1, nodeCount(NC).
node(1).
node(2).

% node tag types
% 0 = html
% 1 = body - dynamically defined by the generator
% 2 = div - dynamically defined by the generator
% ...
typeCount(3).
nodeType(0, 0).

% Assign a type to every node
{ nodeType(X, 0..TM) } = 1 :- node(X), TM = TC - 1, typeCount(TC), X > 0.

% X's parent is Y
{ nodeParent(X, 0..Y) } = 1 :- node(X), Y = X - 1, X > 0.

% Indirect Parent
nodeAncestor(X, Y) :- nodeParent(X, Y).
nodeAncestor(X, Y) :- nodeAncestor(X, Z), nodeAncestor(Z, Y).

% Rules
ruleCount(2).
% html > body
rule(0) :- nodeType(X, 0), nodeType(Y, 1), nodeParent(Y, X).
% body div
rule(1) :- nodeType(X, 1), nodeType(Y, 2), nodeAncestor(Y, X).

% reject if not all rules are fulfilled
:- N = #count { R : rule(R) }, N < RC, ruleCount(RC).

```


Generate the minimal amount of HTML code required to showcase some CSS selectors.
Like if you have this
```css
html > body {
 /* imagine there were CSS rules here */
}
html div {
 /* imagine there were CSS rules here */
}
div.cat {
 /* imagine there were CSS rules here */
}
#neko {
 /* imagine there were CSS rules here */
}
```

Then one minimal HTML code would be 
```html
<html>
  <body>
    <div class="cat" id="neko">
    </div>
  </body>
</html>
```
Another one would be
```html
<html id="neko">
  <body>
  </body>
  <div class="cat">
  </div>
</html>
```
