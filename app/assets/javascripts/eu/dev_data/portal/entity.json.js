define([], function(){

  var data = {
    "about": {
    },
    "by": {
      "more_items_query": "javascript:alert('load more');",
      "more_items_total_formatted": "321",
      "items": [
        {
          "title": "The Lighthouse, Glasgow (Glasgow Herald Building) - Exterior, stonework over entrance | Mackintosh, Charles Rennie and Charles Rennie Mackintosh",
          "is_image": true,
          "img": {
            "src": "/images/search/search-result-thumb-1.jpg",
            "alt": "Rectangle"
          }
        },
        {
          "title": "Glasgow School of Art - Exterior, Renfrew Street metalwork | Mackintosh, Charles Rennie",
          "is_image": true,
          "img": {
            "src": "/images/search/search-result-thumb-lincoln.jpg",
            "alt": "Rectangle"
          }
        },
        {
          "title": "Glasgow",
          "is_image": true,
          "img": {
            "src": "/images/search/search-result-thumb-3.jpg",
            "alt": "Rectangle"
          }
        },
        {
          "title": "The Lighthouse, Glasgow (Glasgow Herald Building) - Model (on display) | Mackintosh, Charles Rennie",
          "is_image": true,
          "img": {
            "src": "/images/search/search-result-thumb-4.jpg",
            "alt": "Rectangle"
          }
        },
        {
          "title": "Glasgow School of Art - Interior, lighting (rose motif) | Mackintosh, Charles Rennie",
          "is_image": true,
          "img": {
            "src": "/images/search/search-result-thumb-5.jpg",
            "alt": "Rectangle"
          }
        },
        {
          "title": "Glasgow School of Art - Interior, alcove for mosaic | Mackintosh, Charles Rennie",
          "is_image": true,
          "img": {
            "src": "/images/search/search-result-thumb-6.jpg",
            "alt": "Rectangle"
          }
        },
        {
          "title": "An Elephant, a photograph, a drawing, a painting and a title that is long enough to line-wrap",
          "is_image": true,
          "img": {
            "src": "/images/search/search-result-thumb-giraffe.png",
            "alt": "Rectangle"
          }
        }
      ]
    },
  };

  data.about.items = data.by.items.slice(0).splice(2, 4);

  return {
    getData: function(params){
      console.log('incoming params ' + JSON.stringify(params, null, 4) );
      var res     = data[params.type];
      res.success = res != null;
      return res;
    }
  };
});