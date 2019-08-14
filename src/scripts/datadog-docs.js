import Stickyfill from 'stickyfilljs';
import algoliasearch from 'algoliasearch';

import { initializeIntegrations } from './components/integrations';
import { hideToc, widthCheck, tocWidthUpdate, showTOCIcon, updateTOC, buildTOCMap, buildAPIMap, onScroll } from './components/table-of-contents';

import { moveToAnchor } from './helpers/moveToAnchor';

// Setup for large screen ToC

 let Munchkin;

// gTag
window.dataLayer = window.dataLayer || [];

var siteEnv = document.querySelector('html').dataset.env;
var gaTag = '';
if (siteEnv === 'preview') {
    gaTag = 'UA-21102638-9';
} else if (siteEnv === 'live') {
    gaTag = 'UA-21102638-5';
}

function gtag(){
    dataLayer.push(arguments);
}
gtag('js', new Date());

gtag('config', gaTag);

$(document).ready(function () {

    var sidenavHTML = $('.container .sidenav-nav').clone();
    $('header .sidenav-nav').html(sidenavHTML);

    // ie
    document.createElement('picture');

    // bring back size() for jquery pajinate
    // The number of elements contained in the matched element set
    jQuery.fn.size = function() {
        return this.length;
    };

    $('.table-responsive-container table').each(function() {
        if(!$(this).hasClass('table-responsive')) {
            $(this).addClass('table-responsive');
        }
    });

    $('table').each(function() {
        var emptyThead = true;
        $(this).find('thead th').each(function() {
            if(!$(this).is(':empty')) {
                emptyThead = false;
            }
        });
        if(emptyThead) {
            $(this).find('thead').remove();
        }
    });

    // algolia
    $('.ds-hint').css('background', 'transparent');

    if (document.documentElement.dataset.relpermalink === '/search/') {

        var client = algoliasearch("EOIG7V0A2O", 'c7ec32b3838892b10610af30d06a4e42');
        var results = new RegExp('[\?&]' + "s" + '=([^&#]*)').exec(window.location.href);
        var $pagination = $('#tipue_search_content');
        var query = "";
        try {query = results[1];} catch (e) {}

        // get indexname by language
        var indexName = "docsearch_docs_prod";

        var lang = 'en';
        if(window.location.pathname.indexOf("/fr/") > -1) {
            lang = "fr";
        }

        function getTitle(hit) {
            var title = '';
            title = hit['hierarchy']['lvl0'];
            if(hit['hierarchy'].hasOwnProperty("lvl1")) {
                if(hit['hierarchy']['lvl1'] !== null)
                    title += ' &raquo; ' + hit['hierarchy']['lvl1'];
            }
            if(hit['hierarchy'].hasOwnProperty("lvl2")) {
                if(hit['hierarchy']['lvl2'] !== null)
                    title += ' &raquo; ' + hit['hierarchy']['lvl2'];
            }
            if(hit['hierarchy'].hasOwnProperty("lvl3")) {
                if(hit['hierarchy']['lvl3'] !== null)
                    title += ' &raquo; ' + hit['hierarchy']['lvl3'];
            }
            return title;
        }

        // get results from algolia
        client.search([{
            indexName: indexName,
            query: decodeURIComponent(query),
            params: {
                hitsPerPage: 200,
                attributesToRetrieve: "*",
                facetFilters: ['language:'+lang]
            }
        }], function (err, results) {
            if (!err) {
                // format and populate results
                $('#tipue_search_input').val(decodeURIComponent(query));
                var hits = results['results'][0]['hits'];
                var formatted_results = "";
                if (hits.length) {
                    $('#tipue_search_content').prepend('<div id="tipue_search_results_count">' + hits.length + ' results</div>');
                    for (var i in hits) {

                        var hit = hits[i];
                        formatted_results += '<div class="hit">';
                        formatted_results += '<div class="tipue_search_content_title">' +
                            '<a href="' + hit["url"] + '">' + getTitle(hit) + '</a></div>';
                        formatted_results += '<div class="tipue_search_content_url">' +
                            '<a href="' + hit["url"] + '">' + hit["url"].replace('https://docs.datadoghq.com', '') + '</a></div>';
                        var text = hit._snippetResult.content.value;
                        formatted_results += '<div class="tipue_search_content_text">' +
                            text + '</div>';
                        formatted_results += '</div>';
                    }
                } else {
                    $('#tipue_search_content').prepend('<div id="tipue_search_results_count">' + hits.length + ' results</div>');
                }
                $('#tipue_search_content .content').html(formatted_results);

                // load pagination
                if (hits.length)
                {
                    var current_page = 1;
                    var num_page_links_to_display = 9;
                    var items_per_page = 7;
                    var page_nums = [];
                    var btn_next = document.getElementById("btn_next");
                    var btn_prev = document.getElementById("btn_prev");
                    var btn_more;
                    var btn_less;
                    var listing_table = document.getElementsByClassName('content')[0];
                    var page_navigation = document.getElementsByClassName('page_navigation')[0];
                    var page_span = document.getElementById("page");

                    function numPages() {
                        return Math.ceil(hits.length / items_per_page);
                    }

                    function initPageNums() {
                        var count = Math.min(numPages(), num_page_links_to_display);
                        page_nums = [];
                        for(var i = 1; i < count+1; i++) {
                            page_nums.push(i);
                        }
                    }

                    function prevPage() {
                        if (current_page > 1) {
                            current_page--;
                            if(current_page < page_nums[0]) {
                                less(null);
                            } else {
                                addHistory(current_page);
                                changePage(current_page);
                            }
                        }
                    }

                    function nextPage() {
                        if (current_page < numPages()) {
                            current_page++;
                            if(current_page > page_nums[page_nums.length-1]) {
                                more(null);
                            } else {
                                addHistory(current_page);
                                changePage(current_page);
                            }
                        }
                    }

                    function less(e) {
                        if(e) e.preventDefault();
                        // get last in range
                        var first = page_nums[0];
                        var last = page_nums[page_nums.length-1];
                        page_nums = [];
                        for(var i = (first-num_page_links_to_display); i < first; i++) {
                            page_nums.push(i);
                        }
                        current_page = page_nums[page_nums.length-1];
                        addHistory(current_page);
                        changePage(current_page);
                        return false;
                    }

                    function more(e) {
                        if(e) e.preventDefault();
                        // get last in range
                        var last = page_nums[page_nums.length-1];
                        // go from next number to num_page_links_to_display or however many are left
                        var remaining_pages = numPages() - last;
                        var count = Math.min(remaining_pages, num_page_links_to_display);
                        page_nums = [];
                        for(var i = last+1; i < last+(count+1); i++) {
                            page_nums.push(i);
                        }
                        current_page = page_nums[0];
                        addHistory(current_page);
                        changePage(current_page);
                        return false;
                    }

                    function cleanHandlers() {
                        if(btn_next) {
                            btn_next.removeEventListener('click', btnHandler)
                        }
                        if(btn_prev) {
                            btn_prev.removeEventListener('click', btnHandler)
                        }
                        var pagebtns = document.getElementsByClassName('page-num');
                        for(var i = 0; i < pagebtns.length; i++) {
                            pagebtns[i].removeEventListener('click', btnHandlerPage);
                        }
                        if(btn_more) {
                            btn_more.removeEventListener('click', more);
                        }
                        if(btn_less) {
                            btn_less.removeEventListener('click', less);
                        }
                    }

                    function btnHandler(e) {
                        e.preventDefault();
                        if(e.target.getAttribute('id') === 'btn_prev') {
                            prevPage();
                        } else if(e.target.getAttribute('id') === 'btn_next') {
                            nextPage();
                        }
                        return false;
                    }

                    function btnHandlerPage(e) {
                        e.preventDefault();
                        var page = parseInt(e.target.getAttribute('data-pagenum'));
                        if (page > numPages()) {
                            page = numPages();
                        } else if(page <= 0) {
                            page = 1;
                        }
                        current_page = page;
                        addHistory(current_page);
                        changePage(current_page);
                        return false;
                    }

                    function setHandlers() {
                        // remove any existing handlers
                        btn_next = document.getElementById("btn_next");
                        btn_prev = document.getElementById("btn_prev");
                        btn_prev.addEventListener('click', btnHandler);
                        btn_next.addEventListener('click', btnHandler);
                        var pagebtns = document.getElementsByClassName('page-num');
                        for(var i = 0; i < pagebtns.length; i++) {
                            pagebtns[i].addEventListener('click', btnHandlerPage);
                        }
                        btn_more = document.getElementsByClassName('more')[0];
                        btn_less = document.getElementsByClassName('less')[0];
                        if(btn_more) {
                            btn_more.addEventListener('click', more);
                        }
                        if(btn_less) {
                            btn_less.addEventListener('click', less);
                        }
                    }

                    function setNavigation() {
                        var html = '';
                        var cls = '';
                        cleanHandlers();
                        html += '<a class="mr-1 btn btn-sm-tag btn-outline-secondary" href="#" id="btn_prev">Prev</a>';
                        if(page_nums[0] > 1) {
                            html += '<a class="mr-1 btn btn-sm-tag btn-outline-secondary less" href="#">...</a>';
                        }
                        for(var i = 0; i < page_nums.length; i++) {
                            cls = (current_page === page_nums[i]) ? 'active' : '';
                            html += '<a class="mr-1 page-num btn btn-sm-tag btn-outline-secondary '+cls+'" href="#" data-pagenum="'+page_nums[i]+'">'+page_nums[i]+'</a>';
                        }
                        if(page_nums[page_nums.length-1] < numPages()) {
                            html += '<a class="mr-1 btn btn-sm-tag btn-outline-secondary more" href="#">...</a>';
                        }
                        html += '<a class="mr-1 btn btn-sm-tag btn-outline-secondary" href="#" id="btn_next">Next</a>';
                        page_navigation.innerHTML = html;
                        setHandlers();
                    }

                    window.onpopstate = function (event) {
                        if (event.state) {
                            current_page = event.state.page;
                            changePage(current_page);
                        }
                    };

                    function addHistory(page) {
                        var pageName = '?s=' + query;
                        if (page !== 1) pageName += '&p=' + page;
                        history.pushState({ page: page }, '', pageName);
                    }

                    function changePage(page)
                    {
                        page_span = document.getElementById("page");

                        // Validate page
                        if (page < 1) page = 1;
                        if (page > numPages()) page = numPages();

                        listing_table.innerHTML = "";

                        // output our slice of formatted results
                        for (var i = (page-1) * items_per_page; i < (page * items_per_page) && i < hits.length; i++) {
                            var formatted_results = '';
                            formatted_results += '<div class="hit row">';
                            formatted_results += '<div class="col-12">';

                            formatted_results += '<div class="tipue_search_content_title">' +
                                '<a href="' + hits[i]["url"] + '">' + getTitle(hits[i]) + '</a></div>';
                            var text = hits[i]._snippetResult.content.value;
                            formatted_results += '<div class="tipue_search_content_text">' +
                                text + '</div>';

                            formatted_results += '</div>';
                            formatted_results += '</div>';
                            listing_table.innerHTML += formatted_results;
                        }
                        if(page_span) {
                            page_span.innerHTML = page + "/" + numPages();
                        }

                        setNavigation();

                        // set previous and next buttons class
                        btn_prev.classList[page === 1 ? 'add' : 'remove']('disabled');
                        btn_next.classList[page === numPages() ? 'add' : 'remove']('disabled');

                        // set active button class
                        var pagebtns = document.getElementsByClassName('page-num');
                        for(var i = 0; i < pagebtns.length; i++) {
                            var page = parseInt(pagebtns[i].getAttribute('data-pagenum'));
                            pagebtns[i].classList[current_page === page ? 'add' : 'remove']('active');
                        }

                        // scroll to top
                        $("html, body").scrollTop(0);
                    }

                    // init page nums
                    initPageNums();

                    // set initial page
                    var searchParams = new URLSearchParams(window.location.search);
                    if (searchParams.get('p') !== null) current_page = parseInt(searchParams.get('p'));
                    history.replaceState({ page: current_page }, '', '');
                    changePage(current_page);
                }

            } else {
                var content = document.getElementsByClassName('content')[0];
                content.innerHTML = "0 results";
            }
        });
    }

    // docs on mobile dropdown trigger move to anchor
    $('.api-nav .dropdown-menu .dropdown-item').on('click', function(e) {
        var href = $(this).attr('href');
        if(href.substr(0, 1) === '#') {
            moveToAnchor(href.substr(1), false);
            /*var pop = document.getElementById('api-popper')
            if(pop) {
                pop.style.display = (pop.style.display === 'none') ? 'block' : 'none';
            }*/
            return false;
        }
    });

    $('.sidenav-api a').on('click', function(e) {
        var href = $(this).attr('href');
        if(href.substr(0, 1) === '#') {
            moveToAnchor(href.substr(1), false);
            return false;
        }
    });

    // api dropdown select
    $('.api-select').on('change', function(e) {
        var href = $(this).val();
        if(href.substr(0, 1) === '#') {
            moveToAnchor(href.substr(1), false);
            return false;
        }
    });


    var searchParam = getParameterByName('s');
    if(searchParam) {
        $('.sidenav-search input[name="s"]').val(searchParam);
    }

    if($('.sidenav-api').length) {
        $(window).on('resize scroll', function(e) {
            onScroll();
        }).trigger('scroll');

        $(".sidenav-api ul").each(function() {
            if($(this).children().length === 0) {
                $(this).remove();
            }
        });

        buildAPIMap();
        onScroll();
    }

    //$('.side').addClass('side-condensed');
    $(window).on('resize scroll', function(e) {
        var header_h = $('body > header').height();
        var footer_h = $('body > footer').height();
        var padding = 105;
        $('.sidenav-nav').css('maxHeight', document.documentElement.clientHeight - header_h - padding);
    });

    /*if($('.api-nav').length) {
        var ref = document.querySelector('.api-popper-button');
        var pop = document.getElementById('api-popper');
        if(ref && pop) {
            ref.addEventListener('click', function(e) {
                pop.style.display = (pop.style.display === 'none') ? 'block' : 'none';
                var p = new Popper(ref, pop, {
                    placement: "start-bottom",
                    modifiers: {
                        preventOverflow: { enabled: false },
                        hide: {
                            enabled: false
                        }
                    }
                });
                return false;
            });
        }
    }*/

    updateMainContentAnchors();

    $('.api-content h2[id]').each(function() {
        var id = $(this).attr('id');
        $(this).wrapInner('<a href="#'+id+'"></a>').on('click', function(e) {
            moveToAnchor(id, false);
            return false;
        });
    });

    // sticky polyfill trigger
    var elements = document.querySelectorAll('.sticky');
    Stickyfill.add(elements);

    // Polyfill `includes` for Internet Explorer
    if (!String.prototype.includes) {
        Object.defineProperty(String.prototype, 'includes', {
          value: function(search, start) {
            if (typeof start !== 'number') {
              start = 0
            }

            if (start + search.length > this.length) {
              return false
            } else {
              return this.indexOf(search, start) !== -1
            }
          }
        })
      }

    // add targer-blank to external links
    var newLinks = document.getElementsByTagName("a");
    for(let i = 0; i < newLinks.length; i++) {
        if(!newLinks[i].href.includes("datadoghq.com") && !newLinks[i].href.includes("localhost:1313")){
            $("a[href='" + newLinks[i].href + "']").attr("target", "_blank");
        }
    }

    codeTabs();



    // API page
    if($('.api').length) {
        // When language buttons are clicked, show all the code snippets
        // from that language.
        var code_blocks = $('.code-block');
        var lang_blocks = $('.lang-specific');
        var hs = $('h2[id]');
        $('.lang-btn').on('click', function (e) {
            var el = $(this);

            // Find the element currently in the view port
            var scrollElement;
            hs.each(function () {
                if ($(this).offset().top >= window.scrollY) {
                    scrollElement = $(this);
                    return false;
                }
            });

            // Show this language's code blocks and language-specific elements
            var lang = el.data('lang');
            code_blocks.hide();
            //$('.code-block-' + lang).fadeIn();
            $('.code-block-' + lang).show();
            lang_blocks.hide();
            //$('.lang-specific-' + lang).fadeIn();
            $('.lang-specific-' + lang).show();

            // Highlight the active button.
            $('.lang-btn').removeClass('active');
            el.addClass('active');

            // Scroll to the element that was in the viewport (ie retain location).
            if(scrollElement) {
                var id = scrollElement.attr('id');
                moveToAnchor(id, false);
            }

            // Add the language selection to the current URL.
            if (history.pushState) {
                var url = window.location.href.replace(window.location.hash, '').replace(window.location.search, '');
                history.pushState(null, null, url + '?lang=' + lang + window.location.hash)
            }

            return false;
        });
    } else {
        if(window.location.hash) {
            moveToAnchor(window.location.hash.substr(1), true);
        }
    }

    // For sidenav links with anchor tag refs
    $(".sidenav-nav a[href^='#']").click(function(){
        moveToAnchor($(this).attr('href').substr(1), true);
    });


    // ------------- TODO: move TOC js back to own file when webpack migration complete and can import js modules

    

    updateTOC();

    // when page ready collect mapping of link to headers so we aren't checking the dom all the time

    $('.mobile-toc-toggle').on('click touch', function () {
        var icon = $(this).find('i');
        var open = icon.hasClass('icon-small-x');
        if(open) {
            $('.toc-container').toggleClass('mobile-open').toggleClass('d-none');
        } else {
            $('.toc-container').toggleClass('mobile-open').toggleClass('d-none');
        }
        $(this).find('i').toggleClass('icon-small-x').toggleClass('icon-small-bookmark');
        $( document ).trigger( "headerResize", [ parseInt($('body > header').height()) ] );
    });

    $(document).on( "moveToAnchor", function() {
        var open = $('.mobile-toc-toggle i').hasClass('icon-small-x');
        if(open) {
            //$('.mobile-toc-toggle').click();
        }
    });

    

    buildTOCMap();
    onScroll();


    // TODO: move integrations code to own file after webpack update
    initializeIntegrations();


});

function updateMainContentAnchors(){
    // make header tags with ids and make clickable as anchors
    $('.main h2[id], .main h3[id], .main h4[id], .main h5[id]').each(function() {
        var id = $(this).attr('id');
        $(this).wrapInner('<a href="#'+id+'"></a>').on('click', function(e) {
            e.preventDefault();
            moveToAnchor(id);
            return false;
        });
    });

    $(".main a[href^='#']").click(function(e) {
        if(!e.target.parentElement.id) {
            e.preventDefault();
            var id = e.target.hash.split('#').join('');
            moveToAnchor(id);
        }
    });
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function codeTabs(){
    if($('.code-tabs').length > 0) {
        // page load set code tab titles
        $('.code-tabs .tab-content').find('.tab-pane').each(function(idx, item) {
          var navTabsMobile = $(this).closest('.code-tabs').find('.nav-tabs-mobile .dropdown-menu');
          var navTabs = $(this).closest('.code-tabs').find('.nav-tabs'),
              title = $(this).attr('title');
          var lang = title.toLowerCase().replace(/\W/g, '');
          navTabs.append('<li><a href="#" data-lang="'+lang+'">'+title+'</a></li>');
          navTabsMobile.append('<a class="dropdown-item" href="#" data-lang="'+lang+'">'+title+'</a>');
        });

        // page load if we have a lang in url activate those tabs, otherwise activate first
        var sPageURL = decodeURIComponent(window.location.search.substring(1));
        var sURLVariables = sPageURL.split('&');
        var tab = sURLVariables.filter(function(item) {
           return item.split('=')[0] === 'tab';
        }).map(function(item) {
            return item.split('=')[1];
        }).toString();

        function activateTab(el) {
            var tab = el.parent(),
                 tabIndex = tab.index(),
                 tabPanel = el.closest('.code-tabs'),
                 tabPane = tabPanel.find('.tab-pane').eq(tabIndex);
             tabPanel.find('.active').removeClass('active');
             tab.addClass('active');
             tabPane.addClass('active');
             tabPane.addClass('show');
             el.closest('.code-tabs').find('.nav-tabs-mobile .title-dropdown').text(tab.text());
        }

        // clicking a tab open them all
        $('.code-tabs .nav-tabs a').click(function(e){
          e.preventDefault();

          // prepare
          var currentOffset = $(this).offset().top - $(document).scrollTop();

          // find all
          var lang = $(this).data('lang');
          $('.code-tabs .nav-tabs').each(function() {
             var navtabs = $(this);
             var links = $(this).find('a:first');
             var langLinks = $(this).find('a[data-lang="'+lang+'"]');
             if(langLinks.length) {
                 langLinks.each(function() {
                     activateTab($(this));
                 });
             } else {
                 // set first lang selected if nothing selected
                 if(navtabs.find('.active').length === 0) {
                     links.each(function() {
                         activateTab($(this));
                     });
                 }
             }
          });

          var url = window.location.href.replace(window.location.hash, '').replace(window.location.search, '');
          history.replaceState(null, null, url + '?tab=' + lang + window.location.hash)

          // restore
          $(document).scrollTop($(this).offset().top - currentOffset);
        });

        // mobile tabs trigger desktop ones
        $('.code-tabs .nav-tabs-mobile .dropdown-menu a').click(function(e){
            e.preventDefault();
            var ctabs = $(this).parents('.code-tabs');
            var lang = $(this).data('lang');
            var desktopTab = ctabs.find('.nav-tabs a[data-lang="'+lang+'"]');
            if(desktopTab) {
              desktopTab.click();
            }
        });

        // activate language from url or first
        if(tab === '') {
            $('.code-tabs .nav-tabs li:first a').click();
        } else {
            var match = $('.code-tabs .nav-tabs a[data-lang="'+tab+'"]:first');
            if(match.length) {
                match.click();
            } else {
                $('.code-tabs .nav-tabs li:first a').click();
            }
        }
    }
}

// Get sidebar
function hasParentLi(el){
    var els = [];
    while (el) {
        if(el.classList){

            if(el.classList.contains('sidenav-nav')){
            break;
            }

            // Add open class to li if the li has a child ul
            if(el.closest('li') && el.closest('li').querySelectorAll('ul').length !== 0){
                el.closest('li').classList.add('open');
            }

            if (el.closest('.sub-menu') && el.closest('.sub-menu').previousElementSibling) {
                el.closest('.sub-menu').previousElementSibling.classList.add('active');
            }
        }

        els.unshift(el);
        el = el.parentNode;
    }
}

function getPathElement(){
    var domain = window.location.origin;
    var path = window.location.pathname;
    var activeMenus = document.querySelectorAll('.side .sidenav-nav .active, header .sidenav-nav .active');

    for(let i = 0; i < activeMenus.length; i++){
        activeMenus[i].classList.remove('active');
    }

    path = path.replace(/^\//, '');
    path = path.replace(/\/$/, '');

    var aPath = document.querySelector('.side [data-path="'+path+'"]');
    var maPath = document.querySelector('header [data-path="'+path+'"]');

    // TODO: fix exceptions for specific nav links that have the same url but both open the same place
    if (path.includes('agent/guide/upgrade-to-agent-v6')) {
        aPath = document.querySelectorAll('.side [data-path*="agent/guide"]')[0];
        maPath = document.querySelectorAll('header [data-path*="agent/guide"]')[0];
    } else if (path.includes('agent/guide')) {
        aPath = document.querySelectorAll('.side [data-path*="agent/guide"]')[1];
        maPath = document.querySelectorAll('header [data-path*="agent/guide"]')[1];
    }

    if (path.includes('tracing/guide')) {
        aPath = document.querySelector('.side [data-path*="tracing/guide"]');
        maPath = document.querySelector('header [data-path*="tracing/guide"]');
    }

    if (path.includes('monitors/guide')) {
        aPath = document.querySelector('.side [data-path*="monitors/guide"]');
        maPath = document.querySelector('header [data-path*="monitors/guide"]');
    }

    if (path.includes('graphing/widgets')) {
        aPath = document.querySelector('.side [data-path*="graphing/widgets"]');
        maPath = document.querySelector('header [data-path*="graphing/widgets"]');
    }

    if (path.includes('graphing/guide')) {
        aPath = document.querySelector('.side [data-path*="graphing/guide"]');
        maPath = document.querySelector('header [data-path*="graphing/guide"]');
    }

    if (path.includes('security/logs')) {
        aPath = document.querySelectorAll('.side [data-path*="security/logs"]')[1];
        maPath = document.querySelectorAll('header [data-path*="security/logs"]')[1];
    }

    if (path.includes('security/agent')) {
        aPath = document.querySelectorAll('.side [data-path*="security/agent"]')[1];
        maPath = document.querySelectorAll('header [data-path*="security/agent"]')[1];
    }

    if (path.includes('videos')) {
        aPath = document.querySelector('.side [data-path*="videos"]');
        maPath = document.querySelector('header [data-path*="videos"]');
    }

    if (path.includes('account_management/billing')) {
        aPath = document.querySelector('.side [data-path*="account_management/billing"]');
        maPath = document.querySelector('header [data-path*="account_management/billing"]');
    }

    if (path.includes('monitors/monitor_types/trace_analytics')) {
        aPath = document.querySelector('.side [data-path*="monitors/monitor_types/trace_analytics"]');
        maPath = document.querySelector('header [data-path*="monitors/monitor_types/trace_analytics"]');
    }

    if (path.includes('developers/guide')) {
        aPath = document.querySelector('.side [data-path*="developers/guide"]');
        maPath = document.querySelector('header [data-path*="developers/guide"]');
    }

    // if url is domain + /integrations/**
    if ((replaceURL(domain)+ '/' +replacePath(path)).includes(replaceURL(domain) + '/integrations')) {
        aPath = document.querySelector('.side .nav-top-level > [data-path*="integrations"]');
        maPath = document.querySelector('header .nav-top-level > [data-path*="integrations"]');
    }

    if(aPath){
        aPath.classList.add('active');
        hasParentLi(aPath);
    }

    if(maPath){
        maPath.classList.add('active');
        hasParentLi(maPath);
    }
}

// remove open class from li elements and active class from a elements
function closeNav(){
    var activeMenus = document.querySelectorAll('.side .sidenav-nav .active, header .sidenav-nav .active');
    var openMenus = document.querySelectorAll('.side .sidenav-nav .open, header .sidenav-nav .open');

    for(let i = 0; i < activeMenus.length; i++){
        activeMenus[i].classList.remove('active');
    }

    for(let i = 0; i < openMenus.length; i++){
        openMenus[i].classList.remove('open');
    }
}

function updateSidebar(event){


    closeNav();


    getPathElement();



    var isLi = ( event.target.nodeName === "LI" ) ? true : false ;

    if(isLi){
        if (event.target.querySelector('a')) {
            event.target.querySelector('a').classList.add('active');
        }

        if(event.target.closest('li').querySelector('ul') && event.target.closest('li')){
            event.target.closest('li').classList.add('open');
        }
    }else{

        if(event.target.closest('li').querySelector('a')) {
            event.target.closest('li').querySelector('a').classList.add('active');
        }

        if(event.target.closest('li').querySelector('ul')){
            event.target.closest('li').classList.add('open');
        }
    }
};

function loadPage(newUrl) {
    // scroll to top of page on new page load
    window.scroll(0, 0);

    if (document.querySelector('.toc-container.mobile-open')) {
        document.querySelector('.mobile-toc-toggle').click();
    }

    let mainContent = document.getElementById("mainContent");
    const currentTOC = document.querySelector('.toc-container');    

    const httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        // closeTOC();

        // cancel httprequest if hash is changed to prevent page replacing
        window.addEventListener('hashchange', function(e){
            httpRequest.abort();
        })

        if (httpRequest.readyState !== XMLHttpRequest.DONE){
            return;
        }

        const newDocument = httpRequest.responseXML;

        if (newDocument === null){
            return;
        }

        const newContent = httpRequest.responseXML.getElementById("mainContent");
        const newTOC = httpRequest.responseXML.querySelector(".toc-container");

        if (newContent === null){
            return;
        }

        document.title = newDocument.title;

        const meta = {
            "itemprop": [
                "name",
                "description"
            ],
            "name": [
                "twitter\\:site",
                "twitter\\:title",
                "twitter\\:description",
                "twitter\\:creator"
            ],
            "property": [
                "og\\:title",
                "og\\:type",
                "og\\:url",
                "og\\:image",
                "og\\:description",
                "og\\:site_name",
                "article\\:author"
            ]
        };

        const keys = Object.keys(meta);
        for(let i=0;i<keys.length;i++){
            var key = keys[i];
            for(let k=0;k<meta[key].length;k++){
                var selectorPart = meta[key][k];
                try {
                    if( newDocument.head.querySelector('['+key+'='+selectorPart+']') ){
                        var content = newDocument.head.querySelector('['+key+'='+selectorPart+'][content]').content;
                        document.head.querySelector('['+key+'='+selectorPart+'][content]').content = content;
                    }
                }catch(e){
                    console.log(e);
                }
            }
        }

        // update data-relPermalink
        document.documentElement.dataset.relpermalink = newDocument.documentElement.dataset.relpermalink;

        const start = window.performance.now();

        mainContent.parentElement.replaceChild(newContent, mainContent);
        mainContent = newContent;

        const wistiaVid = document.querySelector('.wistia [data-wistia-id]');

        let wistiaVidId;
        if (wistiaVid) {
            wistiaVidId = wistiaVid.dataset.wistiaId;
        }

        if (newTOC.querySelector('#TableOfContents')) {
            currentTOC.replaceWith(newTOC);
                buildTOCMap();
                updateTOC();
                showTOCIcon();
                widthCheck();
                tocWidthUpdate();
                updateMainContentAnchors();
                reloadWistiaVidScripts(wistiaVidId);
                initializeIntegrations();
        } else if (!newTOC.querySelector('#TableOfContents')) {
            if (document.querySelector('.toc-container #TableOfContents')) {
                document.querySelector('.toc-container #TableOfContents').remove();
            }
            hideToc();
        }

        let end = window.performance.now();
        let time = end - start;

        const pathName = new URL(newUrl).pathname;

        // sets query params if code tabs are present

        codeTabs();

        // Gtag virtual pageview
        gtag('config', gaTag, {'page_path': pathName});

        // Marketo
        if (Munchkin) {
            Munchkin.munchkinFunction('clickLink', { href: newUrl});
        }
        

    }; // end onreadystatechange

    httpRequest.responseType = "document";
    httpRequest.open("GET", newUrl);
    httpRequest.send();
};

// when navigating to asynced nav with a Wistia video, the video script tags need to be removed and readded for the video to load
function reloadWistiaVidScripts(vidId){
    var oldWistiaScripts = document.querySelectorAll('.wistia script');
    var wistiaCont = document.querySelector('.wistia');
    var i = 0;

    if (wistiaCont && vidId){

        // remove current script tags
        for(let i; i < oldWistiaScripts.length; i+=1){
            oldWistiaScripts[i].remove();
        }

        // create new script tags
        var wistaVideoScript = document.createElement('script');
        var wistaVideoScript2 = document.createElement('script');

        wistaVideoScript.setAttribute('src','https://fast.wistia.com/assets/external/E-v1.js');
        wistaVideoScript2.setAttribute('src','https://fast.wistia.com/embed/medias/'+ vidId +'.jsonp');

        wistiaCont.appendChild(wistaVideoScript);
        wistiaCont.appendChild(wistaVideoScript2);

    }
}

var sideNav = document.querySelector('.side .sidenav-nav');
var mobileNav = document.querySelector('header .sidenav-nav');

sideNav.addEventListener('click', navClickEventHandler);
mobileNav.addEventListener('click', navClickEventHandler);

function navClickEventHandler(event){
    event.stopPropagation();
    // console.log('clicked on ');
    // console.log(event.target);
    // Remove any existing open and active classes
    var newUrl;

    // If what is clicked is not the actual li tag, ie the img icon span
    if (event.target !== this){

        // Get the targets parent li
        var parentli = event.target.closest('li');

        // Get the a
        var a = parentli.querySelector('a');
        newUrl = a.href;

    }

    // Hide mobile nav after clicking nav element
    if ($('.navbar-collapse').hasClass('show')) {
        $('.navbar-collapse').collapse('hide');
    }

    // TODO: How to fall back to normal behavior?
    // if (event.target.tagName !== "A")
    //     return;

    // History API needed to make sure back and forward still work
    if (history === null)
        return;

    // External links should instead open in a new tab

    newUrl = event.target.closest('li').querySelector('a').href;

    var domain = window.location.origin;

    if (typeof domain !== "string" || newUrl.search(domain) !== 0) {
        event.preventDefault();
        window.open(newUrl, "_blank");
    } else if (loadViaAjax(event.target)) {
        loadPage(newUrl);
        event.preventDefault();
        history.pushState({}, "" /*title*/, newUrl);
        updateSidebar(event);
    } else {
        window.location.href = newUrl;
    }
}

function loadViaAjax(element){
    let hasClassLoad = false;
    let parentHasClassOpen = false;

    if (element.closest('li')) {
        hasClassLoad = element.closest('li').classList.contains('js-load') ? true : false;
    }

    if (element.parentElement) {
        parentHasClassOpen = element.parentElement.classList.contains('js-load') ? true : false;
    }

    if (hasClassLoad) {
        return true;
    } else if (parentHasClassOpen){
        return true;
    } else {
        return false;
    }
}


window.onload = function(){
    getPathElement();
}

// remove branch name from path
function replacePath(inputPath) {
    var thisurl = window.location.protocol + '//' + window.location.host;
    if (thisurl.indexOf("docs-staging") > -1) {
      var path = inputPath
        .split("/")
        .slice(2, 4)
        .join("/");

      return path;
    }
    return inputPath;
}

function replaceURL(input_url) {
    var thisurl = window.location.protocol + '//' + window.location.host;
    if (thisurl.indexOf("docs-staging") > -1) {
      var path = window.location.pathname
        .split("/")
        .slice(0, -3)
        .join("/");
      thisurl = window.location.protocol + '//' + window.location.host + path;
      return thisurl;
    }
    return input_url.replace("https://www.docs.datadoghq.com", thisurl);
}

window.addEventListener('popstate', function(event) {

    var domain = replaceURL(window.location.origin);
    if (event.state) {
        loadPage(window.location.href)
        closeNav();
        getPathElement();
    }

}, false);

// TODO: move Integrations code to own file after webpack update

