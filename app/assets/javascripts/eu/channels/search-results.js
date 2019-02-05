define(['jquery', 'util_scrollEvents', 'eu_data_continuity', 'purl'], function($, scrollEvents, DataContinuity){

  var $url            = $.url();
  var masonry         = null;
  var btnGrid         = $('.icon-view-grid').closest('a');
  var btnList         = $('.icon-view-list').closest('a');

  var resultSizeLinks = $('#results_menu a');

  function log(msg){
    console.log(msg);
  }

  /* Older browsers that can't handle object-fit on images can still handle background-size on div elements */
  var handleIE = function(){
    var test = $('<img style="object-fit: cover"/>');
    var cs = window.getComputedStyle(test[0]);

    if(typeof cs.objectFit === 'undefined' ||
       (!(cs.objectFit || cs['object-fit'] || Object.keys(cs).indexOf('objectFit') > -1 ))){

      $('.search-list-item').each(function(i, ob){
        var $ob = $(ob);
        var src = $ob.find('img').attr('src');
        $ob.find('img').css('visibility', 'hidden');
        $ob.find('.inner').css('background-image', 'url(' + src + ')');
        $ob.find('.inner').css('background-size', 'cover');
      });
    }
  };

  var simulateUrlChange = function(param, newVal, replace){
    var state         = {};
    state[param]  = newVal;

    if(!newVal){
      delete state[param];
    }

    var params        = $url.param();
    params[param] = newVal;

    if(!newVal){
      delete params[param];
    }

    var newParams     = $.param(params);

    if(replace){
      window.history.replaceState(state, '', '?' + newParams);
    }
    else{
      window.history.pushState(state, '', '?' + newParams);
    }
  };

  window.onpopstate = function(e){
    if(e.state){
      if(e.state.view === 'grid'){
        showGrid(true);
      }
      else if(e.state.view === 'list'){
        showList(true);
      }
      if(typeof e.state.results !== 'undefined'){
        loadResults(e.state.results);
      }
    }
    else{
      if (navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1){
        return;
      }
    }
  };

  // fake ajax to assist design
  var loadResults = function(count){
    var items      = $('.result-items > li');
    var itemsCount = items.length;

    if(itemsCount < count){
      var toCopy = $('.result-items > li').slice(0, count - itemsCount);
      toCopy.each(function(i, ob){
        $(ob).parent().append($(ob).clone());
      });

      if($('.result-items > li').length < count){
        loadResults(count);
      }
    }
    else if(itemsCount > count){
      var toRemove = $('.result-items>li').slice(count, itemsCount);
      toRemove.remove();
    }
    styleResultsMenu(count);
  };

  var styleResultsMenu = function(count){
    if($('.result-actions a.dropdown-trigger').length > 0){
      var text = $('.result-actions a.dropdown-trigger').text();
      var int  = text.match(/\d+/)[0];

      count = count ? count : int;
      text = text.replace(int, '');

      $('.result-actions a.dropdown-trigger').html(text + '<span class="active">' + count + '</span>');
    }
  };

  var loadFederatedSetting = function(){
    return (typeof(Storage) === 'undefined') ? false : sessionStorage.getItem('eu_portal_federated') === 'true';
  };

  var saveFederatedSetting = function(setting){
    if(typeof(Storage) !== 'undefined') {
      log('save eu_portal_federated (' + setting + ')');
      sessionStorage.setItem('eu_portal_federated', setting);
    }
  };

  var loadView = function(){
    return (typeof(Storage) === 'undefined') ? 'list' : localStorage.getItem('eu_portal_results_view');
  };

  var saveView = function(view){
    if(typeof(Storage) !== 'undefined') {
      localStorage.setItem('eu_portal_results_view', view);
    }
  };

  var saveResultCount = function(resultCount){
    if(typeof(Storage) !== 'undefined') {
      localStorage.setItem('eu_portal_results_count', resultCount);
    }
  };

  var updateViewParamInLinks = function(param){
    var updateUrl = function($anchor){
      var $linkurl  = $.url($anchor.attr('href'));
      var currParam = $linkurl.param('view');
      if(currParam !== param){
        if(typeof currParam === 'undefined'){
          if(param === 'grid'){
            $anchor.attr('href', $anchor.attr('href') + '&view=' + param);
          }
        }
        else{
          if($anchor.length > 0 && $anchor.attr('href')){
            $anchor.attr('href', $anchor.attr('href').replace('&view=' + currParam, '&view=' + param));
          }
        }
      }
    };

    $('#results_menu .dropdown-menu a, .results-list .pagination a, .searchbar a, .refine a, #settings-menu .menu-sublevel a').not('.filter-name-icon, .mlt_remove').each(function(){
      updateUrl($(this));
    });
  };

  var adaptForNewItemPage = function(){

    if(typeof(Storage) !== 'undefined' && typeof window.newRecordPageDesign === 'boolean' && window.newRecordPageDesign){

      var s       = sessionStorage;
      var page    = $url.param('page');
      var channel = $('.breadcrumbs').data('store-channel-name');

      var fnGetText = function($el){
        return $el.contents().filter(function(){
          return this.nodeType === 3;
        })[0].nodeValue;
      };

      var fnGetAttr = function($el, childPath, attrName){
        var subEl = childPath ? $el.find(childPath) : $el;
        if(subEl.length > 0){
          return subEl.attr(attrName);
        }
        return '';
      };

      var fnItemStorageUrl = function(url){
        if(url){
          var params = $.url(url).param();

          delete params['l'];
          delete params['page'];

          if(channel){
            params['channel'] = channel;
          }

          return url.split('?')[0] + '?' + $.param(params);
        }
      };

      var fnItemStorage = function($el){

        return {
          'url':  fnItemStorageUrl(fnGetAttr($el, '.link', 'href')),
          'media_type': fnGetAttr($el, '.svg-icon', 'class').replace('svg-icon', '').replace('svg-icon-', '').trim(),
          'images': [fnGetAttr($el, 'img', 'src')],
          'title': fnGetText($el.find('.item-info a'))
        };
      };

      var lastResults = [];
      var items       = $('.result-items .search-list-item');
      var resInfo     = $('.result-info').text();

      items.each(function(i, ob){
        lastResults.push(fnItemStorage($(ob)));
      });

      var continuityId = s.getItem('continuityId');

      if(!continuityId){
        continuityId = new Date().getTime();
        s.setItem('continuityId', continuityId);
        s.setItem(continuityId, true);
      }

      DataContinuity.prep(false, continuityId);
      DataContinuity.parameteriseLinks('.result-items .search-list-item', page ? page : 1);

      s.eu_portal_last_results_items         = JSON.stringify(lastResults);
      s.eu_portal_last_results_total         = (resInfo.match(/[\d,\,]+(?=\D*$)/) + '').replace(/[\,,\.]/g, '');
      s.eu_portal_last_results_search_params = JSON.stringify(DataContinuity.getSearchParams());
    }
  };

  var showGrid = function(save){
    $('body').addClass('display-grid');
    btnGrid.addClass('is-active');
    btnList.removeClass('is-active');
    if(save){
      saveView('grid');
    }

    updateViewParamInLinks('grid');
    handleIE();

    require(['masonry', 'jqImagesLoaded'], function(Masonry){

      if($('.result-items').length > 0){
        masonry = new Masonry( '.result-items', {
          itemSelector: '.search-list-item',
          columnWidth: '.grid-sizer',
          percentPosition: true
        });
      }

      $('.result-items').imagesLoaded().progress( function(/*instance, image*/){
        if(masonry){
          masonry.layout();
        }
      }).done( function(){
        var hasSuperTall = false;
        $('.item-image').each(function(i, ob){
          var $ob = $(ob);
          if($ob.height() > 650){
            hasSuperTall = true;
            $ob.addClass('super-tall');
          }
        });
        if(hasSuperTall){
          masonry.layout();
        }
      });
    });
  };

  var showList = function(save){
    if(masonry){
      masonry.destroy();
      masonry = false;
    }
    $('body').removeClass('display-grid');
    btnList.addClass('is-active');
    btnGrid.removeClass('is-active');
    if(save){
      saveView('list');
    }
    updateViewParamInLinks('list');
  };

  var bindResultSizeLinks = function(){
    resultSizeLinks.on('click', function(e){
      saveResultCount(parseInt($(e.target).text()));
    });
  };

  var bindViewButtons = function(defView){
    btnGrid.on('click', function(e){
      e.preventDefault();
      simulateUrlChange('view', 'grid');
      showGrid(true);
    });

    btnList.on('click', function(e){
      e.preventDefault();
      simulateUrlChange('view', 'list');
      showList(true);
    });

    var urlView = $url.param('view');
    if(urlView){
      urlView === 'grid' ? showGrid(true) : showList(true);
    }
    else{
      var savedView = loadView();
      if(savedView){
        if(savedView === 'grid'){
          simulateUrlChange('view', 'grid', true);
          showGrid();
        }
        else{
          // fixes history but rewrites url...
          //simulateUrlChange('view', 'list', true);
          showList();
        }
      }
      else if(defView){
        if(defView === 'grid'){
          simulateUrlChange('view', 'grid', true);
          showGrid(true);
        }
        else{
          showList(true);
        }
      }
      else{
        showList();
      }
    }
    $('.facet-menu .opener').on('click', function(){
      $('.refine').toggleClass('open');
    });
  };

  var bindGA = function(){

    require(['ga'], function(ga){

      $('.item-origin .external').on('click', function(){
        var href =  $(this).attr('href');
        ga('send', {
          hitType: 'event',
          eventCategory: 'Redirect',
          eventAction: href,
          eventLabel: 'CTR List'
        });
      });

      $('.refine a:not(.js-showhide-nested)').on('click', function(e){
        var facetRoot = $(e.target).closest('.filter').find('>.filter-name');
        if(facetRoot.length === 0){
          facetRoot = $(e.target).closest('.filter').parent().closest('.filter');
          facetRoot = facetRoot.find('> .filter-name');
        }
        var facetAction = facetRoot.data('filter-name');
        if(!facetAction){
          facetAction = $(e.target).closest('[data-filter-name]').data('filter-name');
        }

        ga('send', {
          hitType: 'event',
          eventCategory: 'Facets',
          eventAction: facetAction,
          eventLabel: 'Facet selection'
        });
      });

      $('.refine .js-showhide-nested').on('click', function(){
        if($('.refine .js-showhide-nested').data('ga-sent')){
          return;
        }
        ga('send', {
          hitType: 'event',
          eventCategory: 'Licenses',
          eventAction: 'Showing specific licenses to users',
          eventLabel: 'Specific licenses'
        });
        $('.refine .js-showhide-nested').data('ga-sent', true);
      });

      $(document).on('click', '.eu-accordion-tabs a', function(e){
        var tgt          = $(e.target);
        var providerName = tgt.closest('.tab-content').prev('.tab-header').find('.tab-title').text();
        providerName     = providerName ? providerName : $('.tab-header.active').find('.tab-title').text();
        var data = {
          hitType:       'event',
          eventCategory: 'Federated Search',
          eventAction:   tgt.closest('.more-federated-results').length > 0 ? 'View external results page' : 'View external item',
          eventLabel:    providerName
        };
        ga('send', data);
      });
    },
    function(){
      log('Failed to load ga');
    });
  };

  var bindfacetOpeners = function(){
    $('.filter .filter-name').on('click', function(){
      $(this).closest('.filter').toggleClass('filter-closed');
    });
  };

  var bindDateFacetInputs = function() {
    var sd = $('.specific-date > input');
    var s = $('#date-range-start');
    var e = $('#date-range-end');

    if (s.attr('type') === 'date') {
      if (sd.length > 0) {
        sd.on('change', function() {
          if (sd.prop('checked')) {
            sd.closest('.filter-controls').addClass('filter-controls-inline');
            $('.control-group.date.to, .control-group.date.from label').addClass('js-hidden');
            e.val(s.val());
          } else {
            sd.closest('.filter-controls').removeClass('filter-controls-inline');
            $('.control-group.date.to, .control-group.date.from label').removeClass('js-hidden');
            e.val('');
          }
        });

        if (s.val() !== '' && s.val() === e.val()) {
          sd.prop('checked', true);
          sd.trigger('change');
        }

        s.on('change', function() {
          if (sd.prop('checked')) {
            e.val($(this).val());
          }
        });
      }

    } else {
      e.attr('max', new Date().getFullYear());
      s.attr('max', new Date().getFullYear());

      $('.specific-date').remove();

      e.on('change', function(){
        s.attr('max', parseInt(e.val()));
        if( parseInt(s.val()) > parseInt(e.val())){
          s.val(e.val());
        }
      });
    }
  };

  var initPage = function(){

    var defView;

    if(typeof(Storage) !== 'undefined') {

      var label = $('.breadcrumbs').data('store-channel-label');
      var name  = $('.breadcrumbs').data('store-channel-name');
      var url   = $('.breadcrumbs').data('store-channel-url');

      defView   = $('.breadcrumbs').data('store-channel-def-view');

      sessionStorage.eu_portal_channel_label = label;
      sessionStorage.eu_portal_channel_name  = name;
      sessionStorage.eu_portal_channel_url   = url;

      var preferredResultCount = localStorage.getItem('eu_portal_results_count');
      if(preferredResultCount){
        $('.search-multiterm').append('<input type="hidden" name="per_page" value="' + preferredResultCount + '" />');
      }
      // thematicCollection = name;
    }

    bindViewButtons(defView);
    bindResultSizeLinks();
    bindGA();
    bindfacetOpeners();
    bindDateFacetInputs();
    initFederatedSearch();

    scrollEvents.fireAllVisible();

    if($('.eu-clicktip-container').length > 0){
      require(['eu_clicktip'], function(){
        log('loaded clicktip');
      });
    }

    if($('.e7a1418-nav').length > 0){
      require(['e7a_1418'], function(e7a1418){
        e7a1418.initPageInvisible();
      });
    }

    adaptForNewItemPage();
  };

  function initFederatedSearch(){

    var accordionTabs = null;
    var fedSearch     = null;
    var btnExpand     = $('.hotspot-expand');

    var initUI = function(Mustache, template){
      require(['eu_accordion_tabs', 'util_eu_ellipsis'], function(euAccordionTabs, Ellipsis){

        accordionTabs       = euAccordionTabs;
        fedSearch           = $('.eu-accordion-tabs');

        fedSearch.find('.tab-header').on('click', function(){
          fedSearch.find('.tab-content').removeClass('collapsed');
        });

        accordionTabs.init(fedSearch, {
          fnOpenTab: function(index){
            $('.more-federated-results').addClass('js-hidden');
            $('.more-federated-results:eq(' + index + ')').removeClass('js-hidden');
            btnExpand.addClass('expanded');
            fedSearch.addClass('expanded');
            $(window).trigger('ellipsis-update');
          },
          active: 0
        });

        accordionTabs.loadTabs(
          fedSearch,
          function(data, tab, index){

            tab = $(tab);
            tab.find('.tab-subtitle').html(data.tab_subtitle);
            var defLogo = tab.data('content-default-logo');

            $('.more-federated-results:eq(' + index + ')').removeClass('js-empty').find('a').attr('href', data.more_results_url).text(data.more_results_label);

            $.each(data.search_results, function(i, itemData){

              if(itemData){
                itemData.target = '_new';
              }

              if(!itemData.img){
                var type = itemData.is_image ? 'IMAGE' : itemData.is_audio ? 'SOUND' : itemData.is_video ? 'VIDEO' : itemData.is_text ? 'TEXT' : null;
                if(type){
                  itemData.type_img = true;
                }
                else{
                  itemData.default_img          = true;
                  itemData.background_img_class = defLogo;
                }
              }

              if(i === 0){
                itemData.first_item = true;
                itemData.federated_provider_name = tab.find('.tab-title').text();
              }
              if(i === data.search_results.length-1){
                $(window).trigger('eu-accordion-tabs-layout');
              }

              tab.next('.tab-content').append(Mustache.render(template, itemData));
            });

            if(!data.search_results || data.search_results.length === 0){
              tab.addClass('disabled');
            }
            return data;
          },
          function(data, tab, index, completed){
            var ellipsisConf = {textSelectors:['.only-with-tabs', '.only-without-tabs']};
            var tabContent   = $(tab).next('.tab-content');
            var texts        = tabContent.find('.search-list-item .item-info h2 a');

            texts.each(function(i, ob){
              Ellipsis.create($(ob), ellipsisConf);
            });

            if(completed){
              if(!$('.tab-header').index($('.tab-header.active'))>0){
                $('.tab-header:not(.disabled)').first().click();
              }
            }
          }
        );

        fedSearch.addClass('loaded');
        btnExpand.removeClass('loading');
      });
    };

    var doOnHotSpotEvent = function(save, active){

      if(fedSearch){
        if(active){
          accordionTabs.activate(fedSearch, 0);
        }
        else{
          accordionTabs.deactivate(fedSearch);
        }
        fedSearch.toggleClass('expanded');
      }

      if(!btnExpand.hasClass('loaded')){
        require(['util_mustache_loader'], function(EuMustacheLoader){

          var templateUrl = 'search-search-listitem-federated-js/search-search-listitem-federated-js';

          EuMustacheLoader.loadMustache(templateUrl, function(template, Mustache){
            initUI(Mustache, template);
            btnExpand.addClass('loading loaded');
          });
        });
      }

      if(save){
        saveFederatedSetting(btnExpand.hasClass('expanded'));
      }
    };

    $(window).on('hotspot', function(e, data){
      data = data || e.data;
      doOnHotSpotEvent(true, data.active);
    });

    require(['eu_hotspot'], function(HotSpot){

      if(window.I18n){
        $('.hotspot .label-collapse').text(window.I18n.translate('global.actions.collapse'));
        $('.hotspot .label-expand')  .text(window.I18n.translate('global.actions.expand'));
        $('.hotspot .text.collapsed').text(window.I18n.translate('site.results.federated'));
        $('.hotspot .text.expanded') .text(window.I18n.translate('site.results.federated-clicked'));
      }

      HotSpot.initHotspot();

      if(loadFederatedSetting()){
        $('.hotspot').removeClass('collapsed');
        doOnHotSpotEvent(false, true);
      }

    });

  }

  return {
    initPage: function(){
      initPage();
    }
  };
});
