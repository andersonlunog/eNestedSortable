/*
 * jQuery Evented Nested Sortable
 * v 0.0.2 / 2014-04-11
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
    ulSelector: ".e-nested-sortable-ul",
    liSelector: ".e-nested-sortable-li",
    isAllowed: function(data){ return true; } //data is {element: dragEl, parent: newParent, index: newIndex}
  };

  function Plugin(el, options){

    this.options = $.extend({}, defaults, options);
    this.el = $(el);
    this.ulClass = "e-nested-sortable-ul";
    this.liClass = "e-nested-sortable-li";
    this.placeHolderClass = "e-nested-sortable-placeholder";
    this.placeHolderErrorClass = "e-nested-sortable-placeholder-error";
    this.placeHolerSelector = "." + this.placeHolderClass;
    this.init();
  }

  Plugin.prototype = {

    init: function(){
      this.isHandle = false;
      this.isValid = true;
      this.mouseStart = {x: 0, y: 0};
      this.offsetStart = {left: 0, top: 0};
      this.fixIndex = 0;
      var _this = this;
      
      var addSelectors = function(ul){
        var ulTag = ul[0].tagName;
        ul.hasClass(_this.ulClass) || ul.addClass(_this.ulClass);
        ul.children("li").each(function(){
          var li = $(this);
          li.hasClass(_this.liClass) || li.addClass(_this.liClass);
          li.children(ulTag).each(function(){
            addSelectors($(this));
          });
        });
      };

      addSelectors(this.el);

      var onDragStart = function(e){
        _this.dragStart(e);
      };

      var onMove = function(e){
        _this.move(e);
      };

      var onDrop = function(e){
        _this.drop(e);
      };

      this.el.find(this.options.liSelector).mousedown(onDragStart);
      $(window).mouseup(onDrop).mousemove(onMove);
    },

    dragStart: function(e){
      e.preventDefault();
      e.stopPropagation();
      this.cancel();
      this.dragEl = $(e.target);
      this.firstStyle = this.dragEl.attr("style") || "";
      this.dragEl.css({"position": "absolute", "opacity": this.options.opacity, "z-index": "-1"});
      this.isHandle = true;
      this.mouseStart = {x: e.pageX, y: e.pageY};
      this.offsetStart = this.dragEl.offset();
      this.index = this.oldIndex = this.dragEl.index();
      this.parent = this.oldParent = this.dragEl.closest(this.options.ulSelector);
      this.attachPlaceHolder(this.index, this.parent, this.dragEl.outerHeight());

      this.dragEl.offset(this.offsetStart);

      this.el.trigger("drag", {element: this.dragEl, parent: this.parent, index: this.index});
    },

    attachPlaceHolder: function(index, parent, height){
      if(this.placeholder == null)
        this.placeholder = $("<div>").css({
          "height": height + "px"
        }).addClass(this.placeHolderClass);
      else if (height != null)
        this.placeholder.css("height", height);

      if(index === 0)
        parent.prepend(this.placeholder);
      else
        parent.children(this.options.liSelector + ":nth-child(" + index + ")").after(this.placeholder);

      this.index = index;
      this.parent = parent;
    },

    move: function(e){
      if(!this.isHandle)
        return;

      var diffX = e.pageX - this.mouseStart.x;
      var diffY = e.pageY - this.mouseStart.y;
      var offset = {
        left: this.offsetStart.left + diffX,
        top: this.offsetStart.top + diffY
      };
      this.dragEl.offset(offset);
      e.preventDefault();

      var hoverEl = $(document.elementFromPoint(e.pageX, e.pageY)).closest(this.options.ulSelector + "," + this.options.liSelector + "," + this.placeHolerSelector);
      var hoverIndex = hoverEl.index();
      var hoverParent = hoverEl.closest(this.options.ulSelector);
      var isNesting = this.nestle(hoverEl, hoverIndex, hoverParent);

      if(isNesting){
        hoverIndex = isNesting.hoverIndex;
        hoverParent = isNesting.hoverParent;
      }

      if(hoverEl.length === 0 || hoverEl[0] == this.dragEl[0] || //Not Valid
        (hoverIndex == this.index && hoverParent[0] == this.parent[0])) //Not Modified
        return;

      this.placeholder.detach();
      this.attachPlaceHolder(hoverIndex, hoverParent);

      this.fixIndex = hoverParent[0] == this.oldParent[0] && hoverIndex > this.oldIndex ? 1 : 0; //Fix diff index caused by placeholder element

      var retObj = {
        element: this.dragEl,
        parent: this.parent,
        index: this.index - this.fixIndex
      };

      if(this.options.isAllowed(retObj)){
        this.el.trigger("move", retObj);
        this.placeholder.removeClass(this.placeHolderErrorClass);
        this.isValid = true;
      }else{
        this.placeholder.addClass(this.placeHolderErrorClass);
        this.isValid = false;
      }
    },

    nestle: function(hoverEl, hoverIndex, hoverParent){
      if(hoverEl.hasClass(this.placeHolderClass)){
        if(hoverIndex > 0){ //Nestle
          var aboveEl = hoverParent.children(this.options.liSelector + ":nth-child(" + hoverIndex + ")");
          if(aboveEl.length > 0 && this.dragEl.offset().left - aboveEl.offset().left > this.options.nestleSize){
            var aboveGroup = aboveEl.children(this.options.ulSelector).first();
            if(aboveGroup.length !== 0 && aboveGroup.children(this.options.liSelector).length === 0){
              return {
                hoverParent: aboveGroup,
                hoverIndex: 0
              };
            }
          }
        }else if(hoverParent.children(this.options.liSelector).length === 0 && this.dragEl.offset().left - hoverParent.closest(this.options.liSelector).offset().left <= this.options.nestleSize){ //Leave nestle
          var el = hoverParent.closest(this.options.liSelector);
          return {
            hoverParent: el,
            hoverIndex: el.index()
          };
        }
      }
      return false;
    },

    drop: function(){
      this.cancel();
      this.index -= this.fixIndex;
      if((this.parent[0] != this.oldParent[0] || this.index != this.oldIndex) && this.isValid)
        this.el.trigger("drop", {element: this.dragEl, newParent: this.parent, newIndex: this.index, oldParent: this.oldParent, oldIndex: this.oldIndex});
    },

    cancel: function(){
      this.isHandle = false;
      this.isValid = true;
      this.fixIndex = 0;

      if(this.dragEl){
        this.dragEl.attr("style", this.firstStyle);
        this.dragEl = null;
      }
      if(this.placeholder){
        this.placeholder.detach();
        this.placeholder.removeClass(this.placeHolderErrorClass);
      }
    }
  };

  $.fn.eNestedSortable = function(options){
    return this.each(function(){
      new Plugin(this, options);
    });
  };

}(jQuery));
