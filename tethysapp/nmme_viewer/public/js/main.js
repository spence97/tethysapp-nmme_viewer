/*****************************************************************************
 * FILE:    NMME Forecast Viewer MAIN JS
 * DATE:    12/13/2017
 * AUTHOR: Spencer McDonald
 * COPYRIGHT:
 * LICENSE:
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/

var LIBRARY_OBJECT = (function() {
    // Wrap the library in a package function
    "use strict"; // And enable strict mode for this library

    /************************************************************************
     *                      MODULE LEVEL / GLOBAL VARIABLES
     *************************************************************************/
    var animationDelay,
        current_layer,
        element,
        $interactionModal,
        layers,
        map,
        popup,
        $plotModal,
        public_interface,			// Object returned by the module
        slider_max,
        sliderInterval,
        variable_data,
        $vicplotModal,
        wms_workspace,
        wms_url,
        wms_layer,
        wms_source;




    /************************************************************************
     *                    PRIVATE FUNCTION DECLARATIONS
     *************************************************************************/
    var animate,
        add_wms,
        clear_coords,
        get_plot,
        get_styling,
        gen_color_bar,
        init_events,
        init_jquery_vars,
        init_dropdown,
        init_slider,
        init_all,
        init_map,
        update_wms;


    /************************************************************************
     *                    PRIVATE FUNCTION IMPLEMENTATIONS
     *************************************************************************/
    animate = function(){
        var sliderVal = $("#slider").slider("value");

        sliderInterval = setInterval(function() {
            sliderVal += 1;
            $("#slider").slider("value", sliderVal);
            if (sliderVal===slider_max - 1) sliderVal=0;
        }, animationDelay);
    };
    $(".btn-run").on("click", animate);
    //Set the slider value to the current value to start the animation at the );
    $(".btn-stop").on("click", function() {
        //Call clearInterval to stop the animation.
        clearInterval(sliderInterval);
    });

    $(".btn-increase").on("click", function() {
        clearInterval(sliderInterval);

        if(animationDelay > 250){

            animationDelay = animationDelay - 250;
            $("#speed").val((1/(animationDelay/1000)).toFixed(2));
            animate();
        }

    });

    //Decrease the slider timer when you click decrease the speed
    $(".btn-decrease").on("click", function() {
        clearInterval(sliderInterval);
        animationDelay = animationDelay + 250;
        $("#speed").val((1/(animationDelay/1000)).toFixed(2));
        animate();
    });

    init_jquery_vars = function(){
        var $layers_element = $('#layers');
        slider_max = $layers_element.attr('data-slider-max');
        animationDelay = 1000;
    };

    init_map = function() {
        var projection = ol.proj.get('EPSG:3857');
        var baseLayer = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
            })
        });

        var view = new ol.View({
            center: ol.proj.transform([0,0], 'EPSG:4326','EPSG:3857'),
            projection: projection,
            zoom: 2.4
        });
        wms_source = new ol.source.ImageWMS();

        wms_layer = new ol.layer.Image({
            source: wms_source
        });

        layers = [baseLayer,wms_layer];

        map = new ol.Map({
            target: document.getElementById("map"),
            layers: layers,
            view: view
        });
        map.crossOrigin = 'anonymous';
        element = document.getElementById('popup');

        popup = new ol.Overlay({
            element: element,
            positioning: 'bottom-center',
            stopEvent: true
        });

        map.addOverlay(popup);


    };

    init_events = function(){
        (function () {
            var target, observer, config;
            // select the target node
            target = $('#app-content-wrapper')[0];

            observer = new MutationObserver(function () {
                window.setTimeout(function () {
                    map.updateSize();
                }, 350);
            });
            $(window).on('resize', function () {
                map.updateSize();
            });

            config = {attributes: true};

            observer.observe(target, config);
        }());

                map.on("singleclick",function(evt){

            $(element).popover('destroy');


            if (map.getTargetElement().style.cursor == "pointer") {
                var clickCoord = evt.coordinate;
                popup.setPosition(clickCoord);
                var view = map.getView();
                var viewResolution = view.getResolution();

                var wms_url = current_layer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), {'INFO_FORMAT': 'application/json'}); //Get the wms url for the clicked point
                console.log(wms_url)
                if (wms_url) {
                    //Retrieving the details for clicked point via the url
                    $.ajax({
                        type: "GET",
                        url: wms_url,
                        dataType: 'json',
                        success: function (result) {
                            var value = parseFloat(result["features"][0]["properties"]["GRAY_INDEX"]);
                            value = value.toFixed(2);
                            $(element).popover({
                                'placement': 'top',
                                'html': true,
                                //Dynamically Generating the popup content
                                'content':'Forecasted Value: '+value
                            });

                            $(element).popover('show');
                            $(element).next().css('cursor', 'text');


                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            console.log(Error);
                        }
                    });
                }
            }
        });

        map.on('pointermove', function(evt) {
            if (evt.dragging) {
                return;
            }
            var pixel = map.getEventPixel(evt.originalEvent);
            var hit = map.forEachLayerAtPixel(pixel, function(layer) {
                if (layer != layers[0]&& layer != layers[1]){
                    current_layer = layer;
                    return true;}
            });
            map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });

    };

    init_slider = function() {

        $("#slider").slider({
            value: 1,
            min: 0,
            max: slider_max - 1,
            step: 1, //Assigning the slider step based on the depths that were retrieved in the controller
            animate: "fast",
            slide: function( event, ui ) {
                var date_text = $("#select_layer option")[ui.value].text;
                $( "#forecast-date" ).val(date_text); //Get the value from the slider
                var date_value = $("#select_layer option")[ui.value].value;
                update_wms(date_value);
            }

        });
    };

    init_all = function(){
        init_jquery_vars();
        init_map();
        init_events();
        init_slider();
    };


    add_wms = function(){
        // gs_layer_list.forEach(function(item){
        map.removeLayer(wms_layer);
        var year = $("#select_year").find('option:selected').val();
        var month = $("#select_layer").find('option:selected').val();
        var var_name = $("#var_select").find('option:selected').val();
        var mod_name = $("#mod_select").find('option:selected').val();
        var stat_name = $("#stat_select").find('option:selected').val()
        var store_name = year + month
        var layer_name = mod_name + '_' + var_name + '_' + stat_name + ':' + store_name;
        var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>'+layer_name+'</Name><UserStyle><FeatureTypeStyle><Rule>\
            <RasterSymbolizer> \
            <ColorMap> \
            <ColorMapEntry color="#000000" quantity="-999" label="nodata" opacity="0.0" />\
                <ColorMapEntry color="#2471a3" quantity="-40" label="1" opacity="0.7" />\
                <ColorMapEntry color="#2e86c1" quantity="-30" label="1" opacity="0.7" />\
                <ColorMapEntry color="#3498db" quantity="-20" label="1" opacity="0.7" />\
                <ColorMapEntry color="#5dade2" quantity="-10" label="1" opacity="0.7" />\
                <ColorMapEntry color="#85c1e9" quantity="-5" label="1" opacity="0.7" />\
                <ColorMapEntry color="#a3e4d7" quantity="0" label="1" opacity="0.7" />\
                <ColorMapEntry color="#d5f5e3" quantity="5" label="1" opacity="0.7" />\
                <ColorMapEntry color="#f9e79f" quantity="10" label="1" opacity="0.7" />\
                <ColorMapEntry color="#f4d03f" quantity="15" label="1" opacity="0.7" />\
                <ColorMapEntry color="#f5b041" quantity="20" label="1" opacity="0.7" />\
                <ColorMapEntry color="#eb984e" quantity="25" label="1" opacity="0.7" />\
                <ColorMapEntry color="#e57e22" quantity="30" label="1" opacity="0.7" /></ColorMap>\
            </RasterSymbolizer>\
            </Rule>\
            </FeatureTypeStyle>\
            </UserStyle>\
            </NamedLayer>\
            </StyledLayerDescriptor>';

        wms_source = new ol.source.ImageWMS({
            url: 'http://tethys.byu.edu:8181/geoserver/wms',
            params: {'LAYERS':layer_name,'SLD_BODY':sld_string},
            serverType: 'geoserver',
            crossOrigin: 'Anonymous'
        });


        wms_layer = new ol.layer.Image({
            source: wms_source
        });


        map.addLayer(wms_layer);



    };


    update_wms = function(month){
//        map.removeLayer(wms_layer);
//        var store_name = $("#select_layer").find('option:selected').val();
        var year = $("#select_year").find('option:selected').val();
        var var_name = $("#var_select").find('option:selected').val();
        var mod_name = $("#mod_select").find('option:selected').val();
        var stat_name = $("#stat_select").find('option:selected').val();
        var layer_name = mod_name + '_' + var_name + '_' + stat_name + ':' + year + month;
        console.log(layer_name)
        var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>'+layer_name+'</Name><UserStyle><FeatureTypeStyle><Rule>\
            <RasterSymbolizer> \
            <ColorMap> \
            <ColorMapEntry color="#000000" quantity="-999" label="nodata" opacity="0.0" />\
                <ColorMapEntry color="#2471a3" quantity="-40" label="1" opacity="0.7" />\
                <ColorMapEntry color="#2e86c1" quantity="-30" label="1" opacity="0.7" />\
                <ColorMapEntry color="#3498db" quantity="-20" label="1" opacity="0.7" />\
                <ColorMapEntry color="#5dade2" quantity="-10" label="1" opacity="0.7" />\
                <ColorMapEntry color="#85c1e9" quantity="-5" label="1" opacity="0.7" />\
                <ColorMapEntry color="#a3e4d7" quantity="0" label="1" opacity="0.7" />\
                <ColorMapEntry color="#d5f5e3" quantity="5" label="1" opacity="0.7" />\
                <ColorMapEntry color="#f9e79f" quantity="10" label="1" opacity="0.7" />\
                <ColorMapEntry color="#f4d03f" quantity="15" label="1" opacity="0.7" />\
                <ColorMapEntry color="#f5b041" quantity="20" label="1" opacity="0.7" />\
                <ColorMapEntry color="#eb984e" quantity="25" label="1" opacity="0.7" />\
                <ColorMapEntry color="#e57e22" quantity="30" label="1" opacity="0.7" /></ColorMap>\
            </RasterSymbolizer>\
            </Rule>\
            </FeatureTypeStyle>\
            </UserStyle>\
            </NamedLayer>\
            </StyledLayerDescriptor>';

        wms_source.updateParams({'LAYERS':layer_name,'SLD_BODY':sld_string});

    };


//    add_wms = function(){
//        // gs_layer_list.forEach(function(item){
//        map.removeLayer(wms_layer);
//        var var_name = $("#var_select").find('option:selected').val();
//        var mod_name = $("#mod_select").find('option:selected').val();
//        var stat_name = $("#stat_select").find('option:selected').val();
//        var store_name = $("#select_layer").find('option:selected').val();
//        var layer_name = mod_name + '_' + var_name + '_' + stat_name + ':' + store_name;
//        console.log(var_name)
//        if (var_name = 'PRECTOT') {
//            var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>'+layer_name+'</Name><UserStyle><FeatureTypeStyle><Rule>\
//            <RasterSymbolizer> \
//            <ColorMap> \
//            <ColorMapEntry color="#000000" quantity="-999" label="nodata" opacity="0.0" />\
//                <ColorMapEntry color="#8c510a" quantity="0" label="1" opacity="0.4" />\
//                <ColorMapEntry color="#d8b365" quantity="1" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#f6e8c3" quantity="15" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#c7eae5" quantity="30" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#5ab4ac" quantity="45" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#01665e" quantity="60" label="1" opacity="0.7" /></ColorMap>\
//            </RasterSymbolizer>\
//            </Rule>\
//            </FeatureTypeStyle>\
//            </UserStyle>\
//            </NamedLayer>\
//            </StyledLayerDescriptor>';
//        } else {
//            console.log('hey hey hey hey hey')
//            var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>'+layer_name+'</Name><UserStyle><FeatureTypeStyle><Rule>\
//            <RasterSymbolizer> \
//            <ColorMap>\
//            <ColorMapEntry color="#000000" quantity="-999" label="nodata" opacity="0.0" />\
//                <ColorMapEntry color="#2471a3" quantity="-40" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#2e86c1" quantity="-30" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#3498db" quantity="-20" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#5dade2" quantity="-10" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#85c1e9" quantity="-5" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#a3e4d7" quantity="0" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#d5f5e3" quantity="5" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#f9e79f" quantity="10" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#f4d03f" quantity="15" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#f5b041" quantity="20" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#eb984e" quantity="25" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#e57e22" quantity="30" label="1" opacity="0.7" /></ColorMap>\
//            </RasterSymbolizer>\
//            </Rule>\
//            </FeatureTypeStyle>\
//            </UserStyle>\
//            </NamedLayer>\
//            </StyledLayerDescriptor>';
//        }
//
//        wms_source = new ol.source.ImageWMS({
//            url: 'http://localhost:8080/geoserver/wms',
//            params: {'LAYERS':layer_name,'SLD_BODY':sld_string},
//            serverType: 'geoserver',
//            crossOrigin: 'Anonymous'
//        });
//
//        wms_layer = new ol.layer.Image({
//            source: wms_source
//        });
//
//        map.addLayer(wms_layer);
//
//
//
//    };
//
//
//
//    update_wms = function(date_str){
////        map.removeLayer(wms_layer);
////        var store_name = $("#select_layer").find('option:selected').val();
//        var var_name = $("#var_select").find('option:selected').val();
//        var mod_name = $("#mod_select").find('option:selected').val();
//        var stat_name = $("#stat_select").find('option:selected').val();
//        var layer_name = mod_name + '_' + var_name + '_' + stat_name + ':' + date_str;
//        console.log(layer_name)
//        if (var_name = 'PRECTOT') {
//            var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>'+layer_name+'</Name><UserStyle><FeatureTypeStyle><Rule>\
//            <RasterSymbolizer> \
//            <ColorMap> \
//            <ColorMapEntry color="#000000" quantity="-999" label="nodata" opacity="0.0" />\
//                <ColorMapEntry color="#8c510a" quantity="0" label="1" opacity="0.4" />\
//                <ColorMapEntry color="#d8b365" quantity="1" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#f6e8c3" quantity="15" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#c7eae5" quantity="30" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#5ab4ac" quantity="45" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#01665e" quantity="60" label="1" opacity="0.7" /></ColorMap>\
//            </RasterSymbolizer>\
//            </Rule>\
//            </FeatureTypeStyle>\
//            </UserStyle>\
//            </NamedLayer>\
//            </StyledLayerDescriptor>';
//        } else {
//            var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>'+layer_name+'</Name><UserStyle><FeatureTypeStyle><Rule>\
//            <RasterSymbolizer> \
//            <ColorMap>\
//            <ColorMapEntry color="#000000" quantity="-999" label="nodata" opacity="0.0" />\
//                <ColorMapEntry color="#2471a3" quantity="-40" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#2e86c1" quantity="-30" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#3498db" quantity="-20" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#5dade2" quantity="-10" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#85c1e9" quantity="-5" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#a3e4d7" quantity="0" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#d5f5e3" quantity="5" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#f9e79f" quantity="10" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#f4d03f" quantity="15" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#f5b041" quantity="20" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#eb984e" quantity="25" label="1" opacity="0.7" />\
//                <ColorMapEntry color="#e57e22" quantity="30" label="1" opacity="0.7" /></ColorMap>\
//            </RasterSymbolizer>\
//            </Rule>\
//            </FeatureTypeStyle>\
//            </UserStyle>\
//            </NamedLayer>\
//            </StyledLayerDescriptor>';
//        }
//
//        wms_source.updateParams({'LAYERS':layer_name,'SLD_BODY':sld_string});
//
//    };

    /************************************************************************
     *                        DEFINE PUBLIC INTERFACE
     *************************************************************************/

    public_interface = {

    };

    /************************************************************************
     *                  INITIALIZATION / CONSTRUCTOR
     *************************************************************************/

    // Initialization: jQuery function that gets called when
    // the DOM tree finishes loading
    $(function() {
        init_all();
        $("#speed").val((1/(animationDelay/1000)).toFixed(2));
        var colors = chroma.scale(['#f4b042','#4842f4']).mode('lab').correctLightness().colors(10);
        var sld_color_string;
            colors.forEach(function(color,i){
                var color_map_entry = '<ColorMapEntry color="'+color+'" quantity="'+colors[i]+'" label="label'+i+'" opacity="0.7"/>';
                sld_color_string += color_map_entry;
            });

        $("#select_layer").change(function(){
            add_wms();
            var selected_option = $(this).find('option:selected').index();
            $("#slider").slider("value", selected_option);
        }).change();

        $("#mod_select").change(function(){
            add_wms();
        }).change();

        $("#select_year").change(function(){
            add_wms();
        }).change();

        $("#stat_select").change(function(){
            add_wms();
        }).change();

        $("#var_select").change(function(){
            add_wms();
        }).change();

        $("#slider").on("slidechange", function(event, ui) {
            var date_text = $("#select_layer option")[ui.value].text;
            console.log(date_text)
            $( "#forecast-date" ).val(date_text); //Get the value from the slider
            var date_value = $("#select_layer option")[ui.value].value;
            update_wms(date_value);
        });

    });

    return public_interface;

}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.