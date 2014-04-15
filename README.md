eNestedSortable
===============

A jQuery plugin that turns a list draggable and trigger each event occurred (drag, move and drop).

### What the plugin does not?

* Controls the expansion and collapse.
* Change the DOM list and moves the element. It only triggers the events.

But the implementation of these features is very easy. Below I'll show an example of these implementations.

## Usage

### HTML

```
<ol class="sortable">
  <li>Item 1
    <ol>
      <li>Item 1.1</li>
      <li>Item 1.2</li>
    </ol>
  </li>
  <li>Item 2
    <ol></ol>
  </li>
  <li>Item 3
    <ol>
      <li>Item 3.1</li>
      <li>Item 3.2</li>
    </ol>
  </li>
  <li>Item 4</li>
</ol>
```

### JavaScript

```
$(document).ready(function(){
  $(".sortable").eNestedSortable()
  .on("drag", function(e, data){
    console.log(data.element, data.parent, data.index);
  })
  .on("move", function(e, data){
    console.log(data.element, data.parent, data.index);
  })
  .on("drop", function(e, data){
    console.log(data.element, data.newParent, data.newIndex, data.oldParent, data.oldIndex);
  });
});
```

### CSS

This is the style of placeholder element. Can be changed if need.

```
.e-nested-sortable-placeholder {
  border: 1px dashed lightblue;
}
.e-nested-sortable-placeholder-error {
  border-color: red;
}
```

## Options

<dl>
  <dt>opacity</dt>
  <dd>Opacity applied to the dragged element. Default is "0.5".</dd>
  <dt>nestleSize</dt>
  <dd>The distance to the element to be nested. Default is 40.</dd>
  <dt>ulSelector</dt>
  <dd>Selector to list element (`ul` or `ol`). Default is ".e-nested-sortable-ul".</dd>  
  <dt>liSelector</dt>
  <dd>Selector to list item element (`li`). Default is ".e-nested-sortable-li".</dd>
  <dt>isAllowed</dt>
  <dd>The function called when a element is dragged. If it returns false, the `drop` event is not challed and the class `e-nested-sortable-placeholder-error` is added to the placeholder element.
    <br>
    The parameter of this function is:
    <pre>
    {
      element: dragEl,
      parent: newParent,
      index: newIndex
    }
    </pre>
  </dd>
</dl>

## Requirements

jQuery 1.4+

## Notes

* If the list is created dynamically, the `ul` or `ol` should have the class `e-nested-sortable-ul` and the `li`, the class `e-nested-sortable-li`. Or the options `ulSelector` and `liSelector` should be changed.

## Examples

### Move element

```
$(document).ready(function(){
  $(".sortable").eNestedSortable().on("drop", function(e, data){
    if(data.newIndex === 0){
      data.newParent.prepend(data.element);
    }else{
      data.element.detach();
      var aboveEl = data.newParent.children("li:nth-child(" + data.newIndex + ")");
      aboveEl.after(data.element);
    }
  });
});
```
