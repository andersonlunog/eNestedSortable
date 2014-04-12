/*
 * jQuery Event Nested Sortable
 * v 0.0.1 / 2014-04-11
 * https://github.com/andersonlevita/eNestedSortable
 *
 * Copyright (c) 2014-2014 Anderson Nogueira
 * Licensed under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */
 (function($) {

  var defaults = {
    opacity: "0.5",
    nestleSize: 40,
    isAllowed: function(data){ return true; } //data is {element: dragEl, parent: newParent, index: newIndex}
  };

  function Plugin(el, options){

    this.options = $.extend({}, defaults, options);
    this.el = $(el);
    this.ulClass = "e-nested-sortable-ul";
    this.liClass = "e-nested-sortable-li";
    this.placeHolderClass = "e-nested-sortable-placeholder";
    this.placeHolderErrorClass = "e-nested-sortable-placeholder-error";
    this.ulSelector = "." + this.ulClass;
    this.liSelector = "." + this.liClass;
    this.placeHolerSelector = "." + this.placeHolderClass;
    this.isHandle = false;
    this.isValid = true;
    this.mouseStart = {x: 0, y: 0};
    this.offsetStart = {left: 0, top: 0};
    this.fixIndex = 0;
    _this = this;

    var addSelectors = function(ul){
      var ulTag = ul[0].tagName;
      ul.addClass(_this.ulClass);
      ul.children("li").each(function(){
        var li = $(this);
        li.addClass(_this.liClass);
        li.children(ulTag).each(function(){
          addSelectors($(this));
        });
      });
    };

    addSelectors(this.el);

    var onStartDrag = function(e){
      e.preventDefault();
      e.stopPropagation();
      cancel();
      _this.dragEl = $(this);
      _this.firstStyle = _this.dragEl.attr("style") || "";
      _this.dragEl.css({"position": "absolute", "opacity": _this.options.opacity, "z-index": "-1"});
      _this.isHandle = true;
      _this.mouseStart = {x: e.pageX, y: e.pageY};
      _this.offsetStart = _this.dragEl.offset();
      _this.index = _this.firstIndex = _this.dragEl.index();
      _this.parent = _this.firstParent = _this.dragEl.closest(_this.ulSelector);
      attachPlaceHolder(_this.index, _this.parent, _this.dragEl.outerHeight());

      _this.dragEl.offset(_this.offsetStart);

      _this.el.trigger("drag", {element: _this.dragEl, parent: _this.parent, index: _this.index});
    };

    var attachPlaceHolder = function(index, parent, height){
      if(_this.placeholder == null)
        _this.placeholder = $("<div>").css({
          "height": height + "px"
        }).addClass(_this.placeHolderClass);
      else if (height != null)
        _this.placeholder.css("height", height);

      if(index === 0)
        parent.prepend(_this.placeholder);
      else
        parent.children(_this.liSelector + ":nth-child(" + index + ")").after(_this.placeholder);

      _this.index = index;
      _this.parent = parent;
    };

    var onMove = function(e){
      if(!_this.isHandle)
        return;

      var diffX = e.pageX - _this.mouseStart.x;
      var diffY = e.pageY - _this.mouseStart.y;
      var offset = {
        left: _this.offsetStart.left + diffX,
        top: _this.offsetStart.top + diffY
      };
      _this.dragEl.offset(offset);
      e.preventDefault();

      var hoverEl = $(document.elementFromPoint(e.pageX, e.pageY)).closest(_this.ulSelector + "," + _this.liSelector + "," + _this.placeHolerSelector);
      var hoverIndex = hoverEl.index();
      var hoverParent = hoverEl.closest(_this.ulSelector);
      var isNesting = nestle(hoverEl, hoverIndex, hoverParent);

      if(isNesting){
        hoverIndex = isNesting.hoverIndex;
        hoverParent = isNesting.hoverParent;
      }

      if(hoverEl.length === 0 || hoverEl[0] == _this.dragEl[0] || //Not Valid
        (hoverIndex == _this.index && hoverParent[0] == _this.parent[0])) //Not Modified
        return;

      _this.placeholder.detach();
      attachPlaceHolder(hoverIndex, hoverParent);

      _this.fixIndex = hoverParent[0] == _this.firstParent[0] && hoverIndex > _this.firstIndex ? 1 : 0; //Fix diff index caused by placeholder element

      var retObj = {
        element: _this.dragEl,
        parent: _this.parent,
        index: _this.index - _this.fixIndex
      };

      if(_this.options.isAllowed(retObj)){
        _this.el.trigger("move", retObj);
        _this.placeholder.removeClass(_this.placeHolderErrorClass);
        _this.isValid = true;
      }else{
        _this.placeholder.addClass(_this.placeHolderErrorClass);
        _this.isValid = false;
      }
    };

    var nestle = function(hoverEl, hoverIndex, hoverParent){
      if(hoverEl.hasClass(_this.placeHolderClass)){
        if(hoverIndex > 0){ //Nestle
          var aboveEl = hoverParent.children(_this.liSelector + ":nth-child(" + hoverIndex + ")");
          if(aboveEl.length > 0 && _this.dragEl.offset().left - aboveEl.offset().left > _this.options.nestleSize){
            var aboveGroup = aboveEl.children(_this.ulSelector).first();
            if(aboveGroup.length !== 0 && aboveGroup.children(_this.liSelector).length === 0){
              return {
                hoverParent: aboveGroup,
                hoverIndex: 0
              };
            }
          }
        }else if(hoverParent.children(_this.liSelector).length === 0 && _this.dragEl.offset().left - hoverParent.closest(_this.liSelector).offset().left <= _this.options.nestleSize){ //Leave nestle
          var el = hoverParent.closest(_this.liSelector);
          return {
            hoverParent: el,
            hoverIndex: el.index()
          };
        }
      }
      return false;
    };

    var onDrop = function(){
      cancel();
      _this.index -= _this.fixIndex;
      if((_this.parent[0] != _this.firstParent[0] || _this.index != _this.firstIndex) && _this.isValid)
        _this.el.trigger("drop", {element: _this.dragEl, parent: _this.parent, index: _this.index, firstParent: _this.firstParent, firstIndex: _this.firstIndex});
    };

    var cancel = function(){
      _this.isHandle = false;
      if(_this.dragEl)
        _this.dragEl.attr("style", _this.firstStyle);
      if(_this.placeholder){
        _this.placeholder.detach();
        _this.placeholder.removeClass(_this.placeHolderErrorClass);
      }
    };

    this.el.find(_this.liSelector).mousedown(onStartDrag); //Can be put inside addSelectors
    $(window).mouseup(onDrop).mousemove(onMove);
  }

  $.fn.eNestedSortable = function(options){
    return this.each(function(){
      new Plugin(this, options);
    });
  };

}(jQuery));
