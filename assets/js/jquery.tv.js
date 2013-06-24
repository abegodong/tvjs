/**
 * TV Control plugin for jQuery with Adobe Strobe
 * User: abrahamgodong
 * Date: 6/21/13
 * Time: 4:55 AM
 */
/* global $, jQuery */
;(function( $ ) {
    "use strict";
    var tvSettings,
        tvContainer;
    var tvMethods = {
        tv: function() {
            tvContainer.root.data("channel", "");
            tvContainer.root.data("switchTo", "");
            tvSettings.channels = [ { } ].concat(tvSettings.channels);
            tvContainer.content =
                tvContainer = $.extend(
                    {
                        'content' : $('<div />').attr('id',  "tv_content").css( { "width" : "100%", "height" : "100%" } ).appendTo(tvContainer.root),
                        'help' : $('<div />').attr('id',  "tv_help").addClass('tv_help tv_wrap').appendTo(tvContainer.root),
                        'guide' : $('<div />').attr('id',  "tv_guide").addClass('tv_wrap').appendTo(tvContainer.root)
                    }, tvContainer
                );
            tvContainer.help.html(tvMethods.loadHelp());
            $(window).on('hashchange', function() {
                tvMethods.handleHashChange();
            });
            tvMethods.retrieveChannel();
            $(document).keypress(function(e) {
                var keypressed = e.charCode;
                //Handle if hash provided
                if (keypressed !== undefined && keypressed > 47 && keypressed < 58) {
                    clearTimeout($.data(this, 'timer'));
                    var switchTo = tvContainer.root.data("switchTo");
                    if (keypressed > 48 || tvContainer.root.data("switchTo") !== '') {
                        switchTo = switchTo.concat(keypressed - 48);
                        tvContainer.root.data("switchTo", switchTo);
                    }
                    $(this).data('timer', setTimeout(function() {
                        tvContainer.root.data("switchTo", (tvContainer.root.data("switchTo") >>> 0));
                        window.location.hash = tvContainer.root.data("switchTo");
                    }, 600));
                }
                if (keypressed === 72 || keypressed === 104) {
                    tvContainer.help.toggle();
                } //Help (H)
                if (keypressed === 82 || keypressed === 114) {
                    tvContainer.root.data("switchTo", tvContainer.root.data("channel"));
                    tvMethods.loadChannel(true);
                } //Reload (R)
                if (keypressed === 67 || keypressed === 99) {
                    tvMethods.loadGuide(tvContainer.root.data("channel"));
                } //Show current Channel (C)
            });
            $(document).keyup(function(e) {
                //if (e.keyCode == 13) { $('.save').click(); }     // enter
                var channel = tvContainer.root.data("channel") >>> 0;
                if (e.keyCode === 27) {
                    if (tvContainer.help.is(":visible")) { tvContainer.help.toggle(); }
                    else { window.location.hash = ''; }
                }   // esc
                else if ((e.keyCode === 37 || e.keyCode === 40) && 1 <= channel - 1) {
                    tvMethods.channelDown();
                }
                else if ((e.keyCode === 39 || e.keyCode === 38) && tvSettings.channels.length > channel + 1) {
                    tvMethods.channelUp();
                }
            });
            //Handle window resize by reloading video
            $(window).resize(function() {
                tvContainer.root.data("switchTo", tvContainer.root.data("channel"));
                tvMethods.loadChannel(false);
            });
        },
        loadIntro: function() {
            if( /webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
                tvContainer.content.html('<div class="tv_message">Change URL Hash to Channel Number to start streaming</div>');
            }
            else {
                tvContainer.content.html('<div class="tv_message">Press "H" for help and see channels listing or press a number key to start streaming</div>');
            }
            document.title = tvSettings.name;
            tvMethods.storeChannel("");
            tvContainer.root.data("switchTo", "");
        },
        loadError: function(errorCode) {
            var msg = {
                1 : 'Invalid Channel! Please enter valid channel number<br />or press "H" for help and see channels listing.',
                2 : 'Sorry this channel is not currently available for mobile device!',
                3 : 'General Error! Please try reloading site.'
            };
            tvContainer.content.html('<div class="tv_message tv_error">' + msg[errorCode] + '</div>');
            tvMethods.loadTitle("Error! Error code: " + errorCode);
            tvContainer.root.data("switchTo", "");
        },
        loadTitle: function(title) {
            if (tvSettings.useTitle === true) {
                document.title = title;
            }
        },
        loadHelp: function() {
            var out="<p>To start streaming: press your number key corresponding to the channel number below.</p>";
            out += "<DL>";
            $.each(tvSettings.channels, function(key, value) {
                out += "<DT>"+key+"</DT>";
                out += "<DD>"+value.name+"</DD>";
            });
            out += "</DL>";
            out += '<p>Press "H" or "ESC" to close this help menu.<br />Press "R" to reload channel</p>';
            return out;
        },
        loadGuide: function(channel) {
            tvContainer.guide.html(tvSettings.channels[channel].name).fadeIn(2000).fadeOut(4000);
        },
        loadChannel: function(guide) {
            var switchTo = tvContainer.root.data("switchTo");

            if( /webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
                if (tvSettings.mobileSupport === true && tvSettings.channels[switchTo].mobile !== "") {
                    if (guide === true) {
                        tvMethods.loadGuide(switchTo);
                    }
                    tvContainer.content.html('<video width="100%" height="100%" src="'+ tvSettings.channels[switchTo].mobile + '" />');
                    tvMethods.loadTitle(tvSettings.channels[switchTo].name);
                }
                else {
                    tvMethods.loadError(2);
                    switchTo = "";
                }
            }
            else {
                if (guide === true) {
                    tvMethods.loadGuide(switchTo);
                }
                tvContainer.content.html('<embed wmode="transparent" width="100%" height="100%" allowfullscreen="true" allowscriptaccess="always" bgcolor="#000000" flashvars="src='+tvSettings.channels[switchTo].url+'&amp;autoHideControlBar=true&amp;streamType=live&amp;autoPlay=true&amp;scaleMode=stretch" pluginspage="http://www.macromedia.com/shockwave/download/index.cgi?P1_Prod_Version=ShockwaveFlash" quality="medium" src="http://fpdownload.adobe.com/strobe/FlashMediaPlayback_101.swf?rnd=4/[[DYNAMIC]]/1" type="application/x-shockwave-flash">');
                tvMethods.loadTitle(tvSettings.channels[switchTo].name);
            }
            tvContainer.root.data("channel", switchTo);
            tvMethods.storeChannel(switchTo);
            tvContainer.root.data("switchTo", "");
        },
        handleHashChange: function() {
            var hash = window.location.hash.substring(1);
            if (hash === 'null') {
                window.location.hash = "";
                hash = '';
            }
            if (hash === '') {
                tvMethods.loadIntro();
            }
            else if (tvSettings.channels[hash] === undefined) {
                tvMethods.loadError(1);
            }
            else {
                tvContainer.root.data("channel", hash);
                tvContainer.root.data("switchTo", hash);
                tvMethods.loadChannel(true);
            }
        },
        channelUp: function() {
            var channel = tvContainer.root.data("channel") >>> 0;
            tvContainer.root.data("switchTo", channel + 1);
            window.location.hash = tvContainer.root.data("switchTo");
        },
        channelDown: function() {
            var channel = tvContainer.root.data("channel") >>> 0;
            tvContainer.root.data("switchTo", channel - 1);
            window.location.hash = tvContainer.root.data("switchTo");
        },
        storeChannel: function(channel) {
            if(tvSettings.useLocalStorage === true && typeof(Storage)!=="undefined") {
                localStorage.setItem("tvChannel", channel);
            }
        },
        removeChannel: function() {
            if(tvSettings.useLocalStorage === true && typeof(Storage)!=="undefined") {
                localStorage.removeItem("tvChannel");
            }
        },
        retrieveChannel: function() {
            var hash = window.location.hash.substring(1);
            if(tvSettings.useLocalStorage === true && typeof(Storage)!=="undefined" && hash === "" && localStorage.tvChannel !== "undefined" && localStorage.tvChannel !== "") {
                window.location.hash = localStorage.getItem("tvChannel");
            }
            else {
                tvMethods.handleHashChange();
            }
        }
    };
    $.fn.tv = function(options) {
        tvSettings = $.extend( {
            name : "TV Streamer",
            mobileSupport : true,
            useLocalStorage : true,
            channels : [{ }],
            defaultChannel : false,
            autoPlay: true,
            useTitle: true
        }, options);
        //Add Container
        $(this).addClass("tvContainer");
        tvContainer = $.extend({ root : $(this) }, tvContainer);
        tvMethods.tv();
    };
})(jQuery);