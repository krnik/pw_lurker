var col_hide = getCookie("col_hide");
var night = getCookie("night");
var pdx_loaded = false;
var pdx_opened = false;
var global_timestamp = 0;
var displayed_special_msg = [];
var displayed_voting_msg = [];

var last_full_refresh = Math.floor(Date.now() / 1000);

var mousePositions = 0;
var mousePositionLastCheck = 0;
var mcc = 0;
var mpps = [];

var time_quest_interval;
var assoc_quest_interval;


function createLog (tag) {
  return {
    _log: [`[${tag}]`],
    push (message) {
      const date = new Date().toJSON();
      this._log.push(`[${date}]: ${message}`);
    },
    consume () {
      return this._log;
    },
  };
}

$(document).ready(function() {
  setCookie("ps", "");
  start();
  time_tick();

  setInterval(time_tick, 1000);
  setDbgPage();

  $("body a").live("click", function(e) {
    if (!dynamic_pages) return;
    if ($(this).attr("link") != undefined) return;
    if ($(this).closest("#pdx_window").length) return;

    var href = $(this).attr("href");
    var target = $(this).attr("target");

    if (href == undefined) return;
    if (target == "_blank") return;
    if (href.substr(0, 4) == "http") return;
    if (href.substr(0, 10) == "javascript") return;
    if (href.substr(0, 1) == "#") return;
    if (last_full_refresh + refresh_time < Math.floor(Date.now() / 1000))
      return;

    e.preventDefault();

    var get_href = "";

    if (href.indexOf("?") != -1) get_href = href + "&only_content=1";
    else get_href = href + "?only_content=1";

    $("#content_loader").animate({ top: "30px" }, 200);
    $.get(get_href, function(data) {
      refreshInfoCol(function() {
        $("#content").html(data);
        if (col_hide == 1) fast_hide_col();
        $("#content_loader").animate({ top: "0px" }, 200);
        hideComunicates();
        setTimeout(function() {
          hide_popups();
        }, 5000);
        window.history.pushState(href, data.pageTitle, href);
      });
    });
  });

  $("form").live("submit", function(e) {
    performDynamicSubmit(e, this, null);
  });

  $(".inputChanger").live("input focusout", function(_e) {
    var element_id = $(this).attr("id");
    var amount = $(this).val();

    if (amount.length) {
      $("#" + element_id + "_changer").text(
        parseInt($(this).val()).numberFormat(0, ".", ".")
      );
    } else {
      $("#" + element_id + "_changer").text("0");
    }
  });

  $("input:submit").live("click", function(e) {
    var btn = $(this);
    var form = btn.parent("form");
    performDynamicSubmit(e, form, btn);
  });

  $(".msg-important-btn").live("click", function(_e) {
    var object = $(this);

    var user_id = object.attr("user-id");

    $.ajax({
      url: "/ajax",
      data: {
        method: "msg",
        user_id: user_id,
        func: "mark_conversation_as_important"
      },
      type: "post",
      success: function(_output) {
        if (object.hasClass("on")) {
          object.removeClass("on");
          object.addClass("off");
        } else {
          object.removeClass("off");
          object.addClass("on");
        }
      }
    });
  });

  /*
	$(".inputChanger").change(function(){
		$(this).val(parseInt($(this).val()).numberFormat(0,'.','.'));
	});

	$(".inputChanger").click(function(){
		var inputed = $(this).val();

		if(inputed.length == 0) return;

		$(this).val(inputed.replace(/\./g,""));
	}); */

  function performDynamicSubmit(e, that, btn) {
    if (!dynamic_pages) return;
    var url = $(that).attr("action");

    if (url == undefined) url = window.location.href;
    else if (url.substr(0, 4) == "http") return;

    if (last_full_refresh + refresh_time < Math.floor(Date.now() / 1000))
      return;

    e.preventDefault();

    var _get_href = "";

    if (url.indexOf("?") != -1) get_url = url + "&only_content=1";
    else get_url = url + "?only_content=1";

    if (btn == null) btn = $(that).find("input:submit");
    var formData = $(that).serialize();

    formData += "&" + btn.attr("name") + "=" + btn.attr("value");

    $("#content_loader").animate({ top: "30px" }, 200);
    $.ajax({
      type: "POST",
      url: get_url,
      data: formData,
      success: function(data) {
        refreshInfoCol(function() {
          $("#content").html(data);
          if (col_hide == 1) fast_hide_col();
          $("#content_loader").animate({ top: "0px" }, 200);
          hideComunicates();
          setTimeout(function() {
            hide_popups();
          }, 5000);
          window.history.pushState(url, data.pageTitle, url);
        });
      }
    });
  }

  if ($(".msg_new_count").html() == "") $(".msg_new_count").hide();

  if (getCookie("friends_box") == 0) $("#friends_box").css("right", -220);
  else $("#friends_box").css("right", 0);

  $("#friends_box_btn").click(function() {
    if (getCookie("friends_box") == 0) {
      $("#friends_box").animate({ right: 0 }, "fast");
      setCookie("friends_box", 1, 1);
    } else {
      $("#friends_box").animate({ right: -220 }, "fast");
      setCookie("friends_box", 0, 1);
    }
  });

  $("input.only_number").keyup(function() {
    this.value = this.value.replace(/[^0-9\.]/g, "");
  });

  $("#search_icon").toggle(
    function() {
      $(this)
        .parent("li")
        .addClass("active");
      $("#search_input_box").show();
      $("#search_input").focus();
    },
    function() {
      $(this)
        .parent("li")
        .removeClass("active");
      $("#search_input_box").hide();
    }
  );

  $("#search_input").keyup(function(event) {
    var text = $(this).val();
    if (text.length >= 3) {
      if (event.keyCode == "13") {
        event.preventDefault();
        window.location.href = $(
          "#search_result_list .result_row:first-child a"
        ).attr("href");
      } else {
        $.ajax({
          url: "/ajax",
          data: { method: "user_search", fraza: text },
          type: "post",
          success: function(output) {
            if (output.length != 0) {
              $("#search_result_list").html(output);
            }
          }
        });
      }
    } else $("#search_result_list").empty();
  });

  $(".online_status").click(function() {
    $.ajax({
      url: "/ajax",
      data: { method: "change_online_status" },
      type: "post",
      success: function(output) {
        if (output == 0) {
          $(".online_status.online").show();
          $(".online_status.offline").hide();
        } else {
          $(".online_status.online").hide();
          $(".online_status.offline").show();
        }
      }
    });
  });

  $(".cross_icon").click(function() {
    var infoBar = $(this).parent(".infoBar");

    infoBar.animate(
      {
        height: "0px"
      },
      200,
      function() {
        infoBar.remove();
      }
    );
  });

  $(".news_information").click(function() {
    var c_name = "hide_new_" + $(this).attr("new_id");
    setCookie(c_name, 1, 100);
    $(this)
      .parent(".col")
      .remove();
  });

  hideComunicates();

  $("#pdx_btn").click(function() {
    if (!pdx_opened) {
      pdxOpen();
      var page_name = getCookie("pdx_active_page");
      if (typeof page_name == "undefined") page_name = "start";
      pdxLoad(page_name);
    } else {
      pdxHide();
    }
  });

  $("#pdx_copy_btn").live("click", function(_event) {
    $("#pdx_adress")
      .show()
      .select();
  });

  $("#pdx_window a").live("click", function(event) {
    var page_name = $(this).attr("href");
    if (page_name.substr(0, 1) == "/" || page_name.substr(0, 4) == "http")
      return;

    event.preventDefault();

    if (page_name == null) return;
    pdxLoad(page_name);
  });

  $("#dbg_btn").toggle(
    function() {
      dbgOpen();
    },
    function() {
      dbgHide();
    }
  );

  $(".night_btn").live("click", function() {
    if (night == 1) {
      $("body").removeClass("night");
      night = 0;
      setCookie("night", 0, 1);
    } else {
      $("body").addClass("night");
      night = 1;
      setCookie("night", 1, 1);
    }
  });

  function pokeViewButton (pokemonId) {
  }

  $(".poke_view_btn").live("click", function() {
    var p_id = $(this).attr("poke_id");
    var that = $(this);

    $.ajax({
      url: "/ajax",
      data: { method: "load_info_box", closed: col_hide, tab: 0, p_id: p_id },
      type: "post",
      success: function(output) {
        if (output != "error") {
          $(".team_member").removeClass("active");
          that.addClass("active");
          if (col_hide == 0) {
            changePanelTab("team", false);
            $("#info-box-content").html(output);
          } else $(".small_controll_box .content").html(output);
        }
      }
    });
  });

  $(".dbg_menu_item").click(function() {
    var id = $(this).attr("id");
    $(".dbg_content").hide();
    $(".dbg_content#dbgc_" + id).show();
    setCookie("dbg_content", id, 1);
  });

  var prevent_multiclick = false;

  $(".prevent_multiclick").click(function(e) {
    if (prevent_multiclick) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }

    $(this).prop("onclick", null);
    prevent_multiclick = true;
  });
});

$(document).ready(setTimeout(hide_popups, 5000));

$(document).mousemove(function(event) {
  var timestamp = new Date().getTime();

  if (timestamp - mousePositionLastCheck < 100) return;

  mousePositionLastCheck = timestamp;

  mpps.push([event.pageX, event.pageY]);

  mousePositions++;
});

$(document).on("click", function(_event) {
  mcc++;
});

function setMp () {
  const value = Math.round(Math.random() * 40 + 4);
  setCookie('mp', value);
};

setMp();

(function($) {
  $.fn.saveClicks = function() {
    $(this).bind("mousedown.cmap", function(evt) {
      setCookie("lmove_x", evt.pageX, 1);
      setCookie("lmove_y", evt.pageY, 1);
      setMp();
      setCookie("cc", mcc);
      setCookie("sp", cpl(mpps) == true ? 1 : 0);

      if (
        navigator.webdriver == true ||
        window.document.documentElement.getAttribute("webdriver") ||
        window.callPhantom ||
        window._phantom
      ) {
        setCookie("sbd", 1);
      }
    });
  };
})(jQuery);

function cpl(p) {
  if (p.length < 2) return false;
  var a = getA(p[0], p[1]);
  var b = getB(p[0], p[1], a);
  var r = true;
  for (var i = 0; i < p.length; i++) {
    if (!iotsl(p[i][0], p[i][1], a, b)) {
      r = false;
      break;
    }
  }
  return r;
}
function getA(a, b) {
  return (b[1] - a[1]) / (b[0] - a[0]);
}
function getB(pa, _pointB, a) {
  return pa[1] - a * pa[0];
}
function iotsl(c, d, a, b) {
  return d == a * c + b;
}

function sendCaptchaToken(token) {
  $.ajax({
    url: "/ajax",
    data: { method: "captchaToken", token: token },
    type: "post"
  });
}

Number.prototype.numberFormat = function(c, d, t) {
  var n = this,
    c = isNaN((c = Math.abs(c))) ? 2 : c,
    d = d == undefined ? "." : d,
    t = t == undefined ? "," : t,
    s = n < 0 ? "-" : "",
    i = parseInt((n = Math.abs(+n || 0).toFixed(c))) + "",
    j = (j = i.length) > 3 ? j % 3 : 0;
  return (
    s +
    (j ? i.substr(0, j) + t : "") +
    i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
    (c
      ? d +
        Math.abs(n - i)
          .toFixed(c)
          .slice(2)
      : "")
  );
};

function hideComunicates() {
  $(".infoBar.autoHide")
    .delay(5000)
    .animate(
      {
        height: "0px"
      },
      200,
      function() {
        $(this).remove();
      }
    );
}

function refreshInfoCol(callback) {
  $.ajax({
    url: "/ajax",
    data: { method: "get_infocol" },
    type: "post",
    success: function(output) {
      if (output != "") $("#info_col_container").html(output);
      callback();
    }
  });
}

function setDbgPage() {
  if (getCookie("dbg_open") == 1) dbgOpen();
  else dbgHide();

  var page = getCookie("dbg_content");
  if (page !== null) {
    $(".dbg_content").hide();
    $(".dbg_content#dbgc_" + page).show();
  }
}

function showTemplateList() {
  $.ajax({
    url: "/ajax",
    data: { method: "msg", func: "get_template_list" },
    type: "post",
    success: function(output) {
      if (output != "") $("#template_list").html(output);
    }
  });
}

function useTemplate(id) {
  var text = $("#template-id-" + id).html();

  $("#msg_text").val(rehtmlEntities(text));
}

function showAdTemplateList() {
  $.ajax({
    url: "/ajax",
    data: { method: "association", func: "get_ad_template_list" },
    type: "post",
    success: function(output) {
      if (output != "") $("#ad_template_list").html(output);
    }
  });
}

function useAdTemplate(id) {
  $.ajax({
    url: "/ajax",
    data: { method: "association", func: "get_ad_template_text", id: id },
    type: "post",
    success: function(output) {
      if (output != "") $("#msg_text").val(output);
    }
  });
}

function removeAdTemplate(id) {
  $.ajax({
    url: "/ajax",
    data: { method: "association", func: "remove_ad_template", id: id },
    type: "post",
    success: function(_output) {
      $("#ad-template-id-" + id).remove();
    }
  });
}

function showInfo(type, message) {
  switch (type) {
    case 1:
      type = "success";
      break;
    case 2:
      type = "warning";
      break;
    case 3:
      type = "error";
      break;
  }

  $("#content").prepend(
    '<div class="infoBar ' +
      type +
      ' autoHide">' +
      message +
      '</div><div class="clear"></div>'
  );
  $(".infoBar")
    .delay(5000)
    .animate(
      {
        height: "0px"
      },
      200,
      function() {
        $(this).remove();
      }
    );
}

function hide_popups() {
  $(".popup_item").each(function(index) {
    setTimeout(
      function(el) {
        el.slideUp(300);
      },
      index * 280,
      $(this)
    );
  });
}

function add_popup(img, text) {
  return new Promise((resolve) => {
    var res = '<div class="popup_item">';
    if (img.length != 0)
      res += '<div class="img"><img src="/img/' + img + '" height="50"/></div>';
    res += '<div class="text">' + text + "</div></div>";

    $(res)
      .appendTo("#popup_list")
      .delay(5000)
      .slideUp(300);

    return resolve();
  });
}

function start() {
  global_timestamp = parseInt($("#global_timestamp").text());

  if (col_hide == 1) fast_hide_col();

  if (night == 1) $("body").addClass("night");

  money_anim();
}

function money_anim() {
  var anim_box = $("#money_anim");
  var diff = parseInt(anim_box.attr("moneydiff"));
  if (diff == 0 || col_hide == 1) return;

  if (diff > 0)
    anim_box.html(
      '<span style="color:green;">+' +
        diff.numberFormat(0, ".", ".") +
        "&yen;</span>"
    );
  else
    anim_box.html(
      '<span style="color:red;">' +
        diff.numberFormat(0, ".", ".") +
        "&yen;</span>"
    );

  anim_box.animate(
    {
      right: "-=80"
    },
    500,
    function() {
      anim_box.animate(
        {
          opacity: 0
        },
        800
      );
    }
  );
}

function show_col() {
  col_hide = 0;
  setCookie("col_hide", 0, 1);
  $(".small_controll_box").animate(
    {
      left: "-125px"
    },
    200,
    function() {
      $("body, #top_bar, #bottom_bar").removeClass("small-body");
      $("#container").removeClass("full-width");
      $("#info_col").css({ top: "45px" });
      $("#info_col").animate(
        {
          marginLeft: "0px"
        },
        200
      );
    }
  );
}

function hide_col() {
  col_hide = 1;
  setCookie("col_hide", 1, 1);
  $("#info_col").animate(
    {
      marginLeft: "-350px"
    },
    200,
    function() {
      $(".controll_box").addClass("no-shadow");
      $("body, #top_bar, #bottom_bar").addClass("small-body");
      $("#container").addClass("full-width");
      $(".small_controll_box").animate({
        left: "0px"
      });
    }
  );
}

function fast_hide_col() {
  $("#info_col").css({ marginLeft: "-350px", top: "205px" });
  $(".controll_box").addClass("no-shadow");
  $("body, #top_bar, #bottom_bar").addClass("small-body");
  $("#container").addClass("full-width");
  $(".small_controll_box").css("left", "0px");
  col_hide = 1;
}

function time_tick() {
  global_timestamp++;
  $("#game_time").text(getTime(global_timestamp));
}

function getTime(_seconds) {
  var currentdate = new Date(global_timestamp * 1000);
  var datetime =
    (currentdate.getHours() < 10
      ? "0" + currentdate.getHours()
      : currentdate.getHours()) +
    ":" +
    (currentdate.getMinutes() < 10
      ? "0" + currentdate.getMinutes()
      : currentdate.getMinutes()) +
    ":" +
    (currentdate.getSeconds() < 10
      ? "0" + currentdate.getSeconds()
      : currentdate.getSeconds());
  return datetime;
}

function setCookie(cookieName, cookieValue, nDays) {
  var today = new Date();
  var expire = new Date();
  if (nDays == null || nDays == 0) nDays = 1;
  expire.setTime(today.getTime() + 3600000 * 24 * nDays);
  document.cookie =
    cookieName +
    "=" +
    escape(cookieValue) +
    ";expires=" +
    expire.toGMTString() +
    "; path=/";
}

function getCookie(c_name) {
  var i,
    x,
    y,
    ARRcookies = document.cookie.split(";");

  for (i = 0; i < ARRcookies.length; i++) {
    x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
    y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
    x = x.replace(/^\s+|\s+$/g, "");
    if (x == c_name) {
      return unescape(y);
    }
  }
}

function pdxOpen() {
  if (!pdx_loaded) $("#top_bar").append('<div id="pdx_window"></div>');

  $("#pdx_btn")
    .parent("li")
    .addClass("active");
  var pdx_window = $("#pdx_window");
  pdx_window.show();
  pdx_loaded = true;
  pdx_opened = true;
  pdx_window.animate(
    {
      height: "600px"
    },
    200,
    function() {}
  );
}

function pdxHide() {
  var pdx_window = $("#pdx_window");
  pdx_window.animate(
    {
      height: "0px"
    },
    200,
    function() {
      pdx_window.hide();
      pdx_opened = false;
      $("#pdx_btn")
        .parent("li")
        .removeClass("active");
    }
  );
}

function pdxSearch(e) {
  var key = e.value;

  if (key.length < 2) {
    $("#pdx_search_list").empty();
    return;
  }

  $.ajax({
    url: "/pokedex",
    data: {
      method: "search",
      key: key
    },
    type: "post",
    success: function(wynik) {
      if (wynik != "") {
        $("#pdx_search_list").empty();
        $("#pdx_search_list").html(wynik);
      }
    }
  });
}

function dbgOpen() {
  $("#dbg_btn")
    .parent("li")
    .addClass("active");
  $("#dbg_window").show();
  setCookie("dbg_open", 1, 1);
}

function dbgHide() {
  $("#dbg_window").hide();
  $("#dbg_btn")
    .parent("li")
    .removeClass("active");
  setCookie("dbg_open", 0, 1);
}

function drinkOak() {
  $.ajax({
    url: "/ajax",
    data: {
      method: "drink_oak"
    },
    type: "post",
    success: function(wynik) {
      wynik = JSON.parse(wynik);
      if (wynik["w"] == 0) {
        gameAlert(wynik["t"]);
      } else {
        $("#action_points_count").text($("#max_action_points_count").text());
        $("#action_points_progress").css("width", "100%");
        $("#dr_oak_drink_count").text(wynik["c"]);
        showInfo(1, "Wypiłeś napój Profesora Oaka.");
      }
    }
  });
}

function drinkJuniper() {
  $.ajax({
    url: "/ajax",
    data: {
      method: "drink_juniper"
    },
    type: "post",
    success: function(wynik) {
      wynik = JSON.parse(wynik);
      if (wynik["w"] == 0) {
        gameAlert(wynik["t"]);
      } else {
        $("#action_points_count").text(wynik["ap"]);
        $("#action_points_progress").css("width", wynik["percent"] + "%");
        $("#prof_juniper_drink_count").text(wynik["c"]);
        showInfo(1, "Wypiłeś napój Profesora Junipera.");
      }
    }
  });
}

function depositIn() {
  $.ajax({
    url: "/ajax",
    data: {
      method: "deposit_in"
    },
    type: "post",
    success: function(wynik) {
      wynik = JSON.parse(wynik);
      if (wynik["w"] == 0) {
        gameAlert(wynik["t"]);
      } else {
        $("#money_anim").attr("moneydiff", -wynik["taken"]);
        money_anim();
        $("#money").text("0 ¥");

        $("#money_deposit").text(wynik["c"] + " ¥");

        $("#deposit_out_button").css("display", "inline");
        $("#deposit_in_button").css("display", "none");

        showInfo(1, "Wpłaciłeś wszystko do Depozytu.");
      }
    }
  });
}

function depositOut() {
  $.ajax({
    url: "/ajax",
    data: {
      method: "deposit_out"
    },
    type: "post",
    success: function(wynik) {
      wynik = JSON.parse(wynik);
      if (wynik["w"] == 0) {
        gameAlert(wynik["t"]);
      } else {
        $("#money_anim").attr("moneydiff", wynik["c"]);
        money_anim();
        $("#money").text(wynik["money"] + " ¥");

        $("#money_deposit").text("0 ¥");

        $("#deposit_out_button").css("display", "none");
        $("#deposit_in_button").css("display", "inline");

        showInfo(1, "Wypłaciłeś wszystko z Depozytu.");
      }
    }
  });
}

function healAll() {
  $.ajax({
    url: "/ajax",
    data: {
      method: "heal_all"
    },
    type: "post",
    success: function(wynik) {
      wynik = JSON.parse(wynik);
      if (wynik["w"] == 0) {
        gameAlert(wynik["t"]);
      } else {
        $("#money_anim").attr("moneydiff", -wynik["p"]);
        money_anim();
        $("#money").text(wynik["money"] + " ¥");

        $(".not-full-health").each(function() {
          $(this)
            .removeClass("gray")
            .removeClass("not-full-health")
            .addClass("light-blue")
            .addClass("poke-select");

          var poke_id = $(this).attr("poke_id");
          $(this).attr("onclick", "poke_" + poke_id + ".submit()");
          $(this).css("cursor", "pointer");

          $(this)
            .find(".poke-hp")
            .text(
              $(this)
                .find(".poke-max-hp")
                .text()
            );
          $(this)
            .find(".health")
            .css("width", "100%");
        });

        var hp = parseInt(wynik["hp"]).numberFormat(0, ".", ".");
        $("#pokemon_health_bar").css("width", "100%");
        $("#pokemon_health_text").text("Życie: " + hp + " / " + hp);

        showInfo(1, "Wyleczyłeś wszystkie swoje pokemony.");

        if (wynik["done"])
          showInfo(1, "Wypełniłeś część zadania od Profesora Elma.");
      }
    }
  });
}

function healLider() {
  $.ajax({
    url: "/ajax",
    data: {
      method: "heal_lider"
    },
    type: "post",
    success: function(wynik) {
      wynik = JSON.parse(wynik);
      if (wynik["w"] == 0) {
        gameAlert(wynik["t"]);
      } else {
        $("#money_anim").attr("moneydiff", -wynik["p"]);
        money_anim();
        $("#money").text(wynik["money"] + " ¥");

        showInfo(1, "Wyleczyłeś lidera.");

        var poke_id = wynik["poke_id"];

        $(".not-full-health").each(function() {
          if (poke_id == $(this).attr("poke_id")) {
            //jeżeli jest liderem

            $(this)
              .removeClass("gray")
              .removeClass("not-full-health")
              .addClass("light-blue")
              .addClass("poke-select");

            $(this).attr("onclick", "poke_" + poke_id + ".submit()");
            $(this).css("cursor", "pointer");

            $(this)
              .find(".poke-hp")
              .text(
                $(this)
                  .find(".poke-max-hp")
                  .text()
              );
            $(this)
              .find(".health")
              .css("width", "100%");
          }
        });

        var hp = parseInt(wynik["hp"]).numberFormat(0, ".", ".");
        $("#pokemon_health_bar").css("width", "100%");
        $("#pokemon_health_text").text("Życie: " + hp + " / " + hp);

        if (wynik["done"])
          showInfo(1, "Wypełniłeś część zadania od Profesora Elma.");
      }
    }
  });
}

function drinkFavourite() {
  $.ajax({
    url: "/ajax",
    data: {
      method: "drink_favourite"
    },
    type: "post",
    success: function(wynik) {
      wynik = JSON.parse(wynik);

      if (wynik["w"] == 0) {
        gameAlert(wynik["t"]);
      } else {
        $("#pokemon_health_bar").css("width", wynik["p"] + "%");
        $("#pokemon_health_text").text(
          "Życie: " + wynik["h"] + " / " + wynik["mh"]
        );
        $("#favourite_drink_count").text(wynik["fdc"]);

        var poke_id = wynik["poke_id"];
        var pokemon = $("form[name='poke_" + poke_id + "']");

        pokemon
          .find(".box")
          .removeClass("gray")
          .addClass("light-blue")
          .addClass("poke-select");

        if (wynik["remove_full_health"])
          pokemon.find(".box").removeClass("not-full-health");

        pokemon.attr("onclick", "poke_" + poke_id + ".submit()");
        pokemon.css("cursor", "pointer");

        pokemon.find(".poke-hp").text(wynik["h"]);
        pokemon.find(".health").css("width", wynik["p"] + "%");

        showInfo(1, "Wyleczyłeś Liderowi 50 punktów zdrowia.");
      }
    }
  });
}

function drinkFavouriteAndFight() {
  $.ajax({
    url: "/ajax",
    data: {
      method: "drink_favourite"
    },
    type: "post",
    success: function(wynik) {
      wynik = JSON.parse(wynik);

      if (wynik["w"] == 0) {
        gameAlert(wynik["t"]);
      } else {
        $("#pokemon_health_bar").css("width", wynik["p"] + "%");
        $("#pokemon_health_text").text(
          "Życie: " + wynik["h"] + " / " + wynik["mh"]
        );

        var pokemon_id = wynik["pokemon_id"];

        $("form[name='poke_" + pokemon_id + "']").submit();

        showInfo(1, "Wyleczyłeś Liderowi 50 punktów zdrowia.");
      }
    }
  });
}

function phToPa() {
  $.ajax({
    url: "/ajax",
    data: {
      method: "ph_to_pa"
    },
    type: "post",
    success: function(wynik) {
      if (wynik == parseInt("-1")) {
        gameAlert("Nie posiadasz takiej ilości punktów honoru.");
      } else if (wynik == parseInt("-2")) {
        gameAlert("Nie możesz uzupełnić PA w Rezerwacie.");
      } else if (wynik == parseInt("-3")) {
        gameAlert("Nie możesz uzupełnić PA.");
      } else {
        var sum =
          parseInt($("#action_points_count").text()) + parseInt(wynik) * 5;
        var p = Math.round(
          (parseInt($("#max_action_points_count").text()) / sum) * 100
        );
        $("#action_points_count").text(sum);
        $("#action_points_progress").css("width", p + "%");
        showInfo(
          1,
          "Uzupełniłeś " +
            parseInt(wynik) * 5 +
            " punktów akcji, za " +
            wynik +
            "&pound."
        );
      }
    }
  });
}

function pdxLoad(page) {
  var pdx = $("#pdx_window");
  pdx.empty().html('<div id="loading"></div>');

  setCookie("pdx_last_page", getCookie("pdx_active_page"), 1);

  $.ajax({
    url: "/pokedex",
    data: {
      method: "loadPage",
      page: page
    },
    type: "post",
    success: function(wynik) {
      if (wynik != "") {
        pdx.empty();
        pdx.html(wynik);
        setCookie("pdx_active_page", page, 1);
      }
    }
  });
}

function pdxAddToFavourite(page_id, _btn) {
  $.ajax({
    url: "/pokedex",
    data: {
      method: "add_to_favourite",
      page_id: page_id
    },
    type: "post",
    success: function(wynik) {
      if (wynik != "") {
        switch (parseInt(wynik)) {
          case 2:
            $("#page_fav_btn").removeClass("no-fav");
            $("#page_fav_btn").addClass("fav");
            break;

          case 1:
            gameAlert("Można mieć maksymalnie 8 ulubionych stron.");
            break;

          case 0:
            $("#page_fav_btn").removeClass("fav");
            $("#page_fav_btn").addClass("no-fav");
            break;
        }
      }
    }
  });
}

function pdxVoteOnPokemon(pokemon_id) {
  $.ajax({
    url: "/pokedex",
    data: {
      method: "vote_pokemon",
      pokemon_id: pokemon_id
    },
    type: "post",
    success: function(wynik) {
      if (wynik != "") {
        switch (parseInt(wynik)) {
          case 1:
            $("#vote_poke_btn").addClass("blocked");
            break;

          case 0:
            gameAlert("W tym tygodniu już głosowałeś na Pokemona.");
            break;
        }
      }
    }
  });
}

function pdxLoadLastPage() {
  var page = getCookie("pdx_last_page");
  if (page != null) pdxLoad(page);
}

function pdxOpenPage(page) {
  pdxOpen();
  pdxLoad(page);
}

function openItemList(p_id) {
  $.ajax({
    url: "/ajax",
    data: { method: "get_poke_item_list", p_id: p_id },
    type: "post",
    success: function(output) {
      $(".new-item-list").html(output);
      $(".new-item-list").show();
    }
  });
}

function openResItemList(p_id) {
  $.ajax({
    url: "/ajax",
    data: { method: "get_poke_res_item_list", p_id: p_id },
    type: "post",
    success: function(output) {
      $(".new-res-item-list").html(output);
      $(".new-res-item-list").show();
    }
  });
}

function close_poke_item_select() {
  $(".new-item-list").hide();
}

function close_poke_res_item_select() {
  $(".new-res-item-list").hide();
}

function addItem(item, p_id) {
  $.ajax({
    url: "/ajax",
    data: { method: "poke_items", item: item, type: 1, p_id: p_id },
    type: "post",
    success: function(output) {
      if (output.trim() != "0" && output.trim() != "10")
        $(".item-box").html(output);
      else if (output.trim() == "10")
        showInfo(
          3,
          "Pokemon nie może trzymać dwóch takich samych przedmiotów."
        );
      else if (output.trim() == "0")
        showInfo(3, "Nie można dać przedmiotu Pokemonowi.");

      $(".new-item-list").hide();
    }
  });
}

function delItem(item, p_id) {
  $.ajax({
    url: "/ajax",
    data: { method: "poke_items", item: item, type: 0, p_id: p_id },
    type: "post",
    success: function(output) {
      if (output != "0") {
        $(".item-box").html(output);
      }
    }
  });
}

function fastItemDel(item, p_id) {
  $.ajax({
    url: "/ajax",
    data: { method: "fast_item_del", item: item, p_id: p_id },
    type: "post",
    success: function(output) {
      if (output.trim() == "1")
        $(".item[name=" + item + "][poke_id=" + p_id + "]").remove();
      else showInfo(3, output);
    }
  });
}

function team_setLeader(id) {
  $.ajax({
    url: "/ajax",
    data: { method: "team_poke", func: "set_leader", id: id },
    type: "post",
    success: function(_output) {
      $(".poke-team-box").removeClass("leader");
      $(".poke-team-box[poke_id=" + id + "]").addClass("leader");
    }
  });
}

function team_setLeaderInfoCol(id) {
  $.ajax({
    url: "/ajax",
    data: { method: "team_poke", func: "set_leader", id: id },
    type: "post",
    success: function(_output) {
      $(".liderBtn").hide();
      $(".poke-team-box").removeClass("leader");
      $(".poke-team-box[poke_id=" + id + "]").addClass("leader");
    }
  });
}

function team_move(from, to, id) {
  $.ajax({
    url: "/ajax",
    data: { method: "team_poke", func: "move_to", from: from, to: to, id: id },
    type: "post",
    success: function(output) {
      if (output.trim() != "") {
        showInfo(3, output);
      } else {
        if (from == "druzyna")
          $(".main_menu_poke[poke_id=" + id + "]").remove();

        team_get_poke_list(from, null, null);
        if (to == "druzyna" || to == getCookie("active_poke_tab"))
          team_get_poke_list(to, null, null);
        else {
          var ilosc = parseInt($("span." + to + "-count-get").text());
          $("span." + to + "-count").text(ilosc + 1 + "");
        }
      }
    }
  });
}

function team_count_poke_group(name) {
  var ilosc = $("div#lista-" + name + " .p-counter").length;
  $("span." + name + "-count").text(ilosc);
}

function lock_unlock(id, pokebox) {
  $.ajax({
    url: "/ajax",
    data: {
      method: "team_poke",
      func: "lock/unlock",
      pokebox: pokebox,
      id: id
    },
    type: "post",
    success: function(output) {
      var lock = $(".r-lock[poke_id=" + id + "]");
      var box = $(".rezerwa-box[poke_id=" + id + "]");

      if (output == 1) {
        lock.removeClass("unlocked");
        lock.addClass("locked");
        if (box.hasClass("orange") == false) {
          box.removeClass("light-blue");
          box.addClass("gray");
        }
      } else {
        lock.removeClass("locked");
        lock.addClass("unlocked");
        if (box.hasClass("orange") == false) {
          box.removeClass("gray");
          box.addClass("light-blue");
        }
      }
    }
  });
}

function ball_lock_unlock(id) {
  $.ajax({
    url: "/ajax",
    data: { method: "plecak", func: "lock/unlock", id: id },
    type: "post",
    success: function(output) {
      var lock = $(".lock[item_id=" + id + "]");
      var locked_text = $("#lt_" + id);
      var locked_buttons = $("#li_" + id);

      if (output == 1) {
        lock.removeClass("unlocked");
        lock.addClass("locked");
        locked_text.show();
        locked_buttons.hide();
      } else {
        lock.removeClass("locked");
        lock.addClass("unlocked");
        locked_text.hide();
        locked_buttons.show();
      }
    }
  });
}

function evolve(id) {
  setMp();
  const log = createLog(`evolve:${id}`);

  log.push('Execution started');

  return new Promise(async (resolve) => {
    $.ajax({
      url: "/ajax",
      data: { method: "team_poke", func: "evolve", id: id },
      type: "post",
      success: function(output) {
        log.push('Ajax request successful');

        switch (output.trim()) {
          case '3':
            log.push('"Twój pokemon ewoluował!"');
            return team_get_poke_list("rezerwa", null, null)
              .then((result) => resolve([
                { success: true, log: log.consume() },
                result,
              ]));

          case '0':
            log.push('"Ten pokemon nie posiada wyższych stadiów ewolucji."');
            break;

          case '1':
            log.push('"Tego pokemona można ewoluować tylko w zakładce stan drużny."');
            break;

          case '2':
            log.push('"Ten pokemon nie spełnia wszystkich wymagań do ewolucji."');
            break;

          case '4':
            log.push('"Nie można ewoluować zablokowanego Pokemona. Jeśli chcesz go ewoluować to odblokuj go klikając na kłódeczkę."');
            break;

          case '5':
            log.push('"Ten pokemon ma zablokowaną możliwość ewolucji. Odbokować tę możliwość możesz w zakładce Stan drużyny."');
            break;

          case '':
            log.push('"Błąd!"');
            break;

          default: 
            log.push('Php response');
            log.push(output);
            break;
        }

        return resolve([{ success: false, log: log.consume() }]);
      },
      error: function (error) {
        log.push(String(error));
        return resolve([{ success: false, log: log.consume() }]);
      },
    });
  });
}

function evolve_advanced(id, next_id) {
  const log = createLog('evolve_advanced');

  return new Promise((resolve) => {
    $.ajax({
      url: "/ajax",
      data: {
        method: "team_poke",
        func: "evolve_advanced",
        id: id,
        next_id: next_id
      },
      type: "post",
      success: function(output) {
        if (output.trim() == "1") {
          log.push('"Twój pokemon ewoluował!"');

          return team_get_poke_list("rezerwa", null, null)
            .then((result) => ([
              { success: true, log: log.consume() },
              result,
            ]));

        } else if (output.trim() == "5")
            log.push('"Ten pokemon ma zablokowaną możliwość ewolucji. Odbokować tę możliwość możesz w zakładce Stan drużyny."');
        else {
          log.push('"Błąd!"');
        }

        log.push(output);
        return resolve([{ success: false, log: log.consume() }]);
      }
    });
  });
}

function addNewPokeBoxGroup() {
  var name = $("#pb_group_name").val();
  $.ajax({
    url: "/ajax",
    data: { method: "team_poke", func: "add_group", name: name },
    type: "post",
    success: function(output) {
      if (output.trim() != "") showInfo(3, output);
      else team_get_poke_list("pokebox", null, null);
    }
  });
}

function delPokeBoxGroup(group_id) {
  $.ajax({
    url: "/ajax",
    data: { method: "team_poke", func: "del_group", group_id: group_id },
    type: "post",
    success: function(output) {
      if (output.trim() == "") team_get_poke_list("pokebox", null, null);
    }
  });
}

function pb_search(t) {
  var sname = $(t).val();
  sname = sname.toLowerCase();

  if (sname.length <= 0) {
    $(".p-search").show();
    return;
  }

  $(".p-search").hide();
  $(".p-search[p_name^='" + sname + "']").each(function(_index) {
    $(this).show();
  });
}

function team_move_list(from, to) {
  var list_id = $("input.check-" + from + ":checkbox:checked")
    .map(function() {
      return $(this).attr("poke_id");
    })
    .get();

  $.ajax({
    url: "/ajax",
    data: {
      method: "team_poke",
      func: "move_to",
      from: from,
      to: to,
      id: list_id
    },
    type: "post",
    success: function(output) {
      if (output.trim() != "") showInfo(3, output);
      else {
        team_get_poke_list(from, null, null);
        if (to == "druzyna") team_get_poke_list(to, null, null);
        else {
          var ilosc = parseInt($("span." + to + "-count-get").text());
          var plus = Object.keys(list_id).length;
          $("span." + to + "-count").text(ilosc + plus + "");
        }
      }
    }
  });
}

function group_pokebox_move_list(selectbox) {
  var target_group = $(selectbox).val();

  var list_id = $("input.check-pokebox:checkbox:checked")
    .map(function() {
      return $(this).attr("poke_id");
    })
    .get();

  $.ajax({
    url: "/ajax",
    data: {
      method: "team_poke",
      func: "group_move_to",
      target_group: target_group,
      id: list_id
    },
    type: "post",
    success: function(output) {
      if (output.trim() != "") showInfo(3, output);
      else team_get_poke_list("pokebox", null, null);
    }
  });
}

function team_sort_poke_list(list_name, sort) {
  $("#sort-" + list_name + " a").removeClass("active");
  $("#sort-" + list_name + " a[sort_by=" + sort + "]").addClass("active");
  team_get_poke_list(list_name, sort, null);
}

function team_sort_poke_ord(list_name, dir) {
  $("#ord-" + list_name + " a").removeClass("active");
  $("#ord-" + list_name + " a[sort_ord=" + dir + "]").addClass("active");
  team_get_poke_list(list_name, null, dir);
}

function team_poke_list_pokebox_sort(group_id, sort) {
  $("#sort-pokebox-" + group_id + " a").removeClass("active");
  $("#sort-pokebox-" + group_id + " a[sort_by=" + sort + "]").addClass(
    "active"
  );

  $("#loader").show();
  $.ajax({
    url: "/ajax",
    data: {
      method: "team_poke",
      func: "set_pokebox_sort",
      group_id: group_id,
      sort: sort
    },
    type: "post",
    complete: function(_output) {
      team_get_poke_list("pokebox", sort, null);
      $("#loader").hide();
    }
  });
}

function team_poke_list_pokebox_ord(group_id, dir) {
  $("#ord-pokebox-" + group_id + " a").removeClass("active");
  $("#ord-pokebox-" + group_id + " a[sort_ord=" + dir + "]").addClass("active");
  $("#loader").show();
  $.ajax({
    url: "/ajax",
    data: {
      method: "team_poke",
      func: "set_pokebox_dir",
      group_id: group_id,
      dir: dir
    },
    type: "post",
    complete: function(_output) {
      team_get_poke_list("pokebox", null, null);
      $("#loader").hide();
    }
  });
}

function poke_change_tab(list_name) {
  team_get_poke_list(list_name, null, null);
  $(".tab_selector").removeClass("active");
  $(".tab_selector[tab=" + list_name + "]").addClass("active");
  setCookie("active_poke_tab", list_name, 1);
}

function team_get_poke_list(list_name, sort, dir) {
  const log = createLog('team_get_poke_list');

  return new Promise((resolve) => {
    $.ajax({
      url: "/ajax",
      data: {
        method: "team_poke",
        func: "get_poke_list",
        list_name: list_name,
        sort: sort,
        dir: dir
      },
      type: "post",
      success: function(output) {
        log.push('Success');

        if (list_name == "druzyna") $("#lista-druzyna").html(output);
        else $("#poke_content").html(output);
        team_count_poke_group(list_name);

        return resolve([{ success: true, log: log.consume() }]);
      },
      error: function (error) {
        log.push(String(error));
        return resolve([{ success: false, log: log.consume() }]);
      },
    });
  });
}

function team_change_ord(dir, id) {
  $.ajax({
    url: "/ajax",
    data: { method: "team_poke", func: "change_ord", dir: dir, id: id },
    type: "post",
    success: function(_output) {
      team_get_poke_list("druzyna", null, null);
    }
  });
}

function show_voting_msg(output) {
  output.id = parseInt(output.id);
  if (displayed_voting_msg.indexOf(output.id) != -1) return;
  displayed_voting_msg.push(output.id);

  var msg = output.msg;
  gameAlert(msg);
}

function show_warning_msg(output) {
  output.id = parseInt(output.id);
  if (displayed_special_msg.indexOf(output.id) != -1) return;
  displayed_special_msg.push(output.id);

  var msg = output.msg;

  gameAlert(msg, function(_data) {
    $.ajax({
      url: "/ajax",
      data: { method: "msg", func: "special_msg_read", id: output.id },
      type: "post"
    });
  });
}

function alert_new_msg(output) {
  var msg_list = output.dane;
  var count = output.count;

  if (count > 0) {
    $("#message_count_info").text(count);
    $("#message_count_info").show();
  }

  $.each(msg_list, function(_id, data) {
    if (data.text.length > 100) data.text = data.text.substr(0, 100) + "...";

    if (!data.login) {
      data.text +=
        '<br/><br/><a href="/poczta/powiadomienia" class="niceButton" style="width: 100%;">Pokaż powiadomienie</a>';
      add_popup("icons/message-popup.png", data.text);
    } else {
      data.text +=
        '<br/><br/><a href="/poczta/rozmowy/' +
        data.user_id +
        '" class="niceButton" style="width: 100%;">Pokaż rozmowę</a>';
      add_popup(
        "icons/message-popup.png",
        "<strong>" + data.login + "</strong>: " + data.text
      );
    }
  });
}

function get_new_messages() {
  $.ajax({
    url: "/ajax",
    data: { method: "msg", func: "get_new_messages" },
    type: "post",
    success: function(output) {
      if (output.trim() != "") {
        output = jQuery.parseJSON(output);

        var msg = output.dane;
        var count = output.count;

        if (count > 0) {
          $("#message_count_info").text(count);
          $("#message_count_info").show();
        }

        $.each(msg, function(_id, data) {
          if (!data.login) add_popup("icons/message-popup.png", data.text);
          else
            add_popup(
              "icons/message-popup.png",
              "<strong>" + data.login + "</strong>: " + data.text
            );
        });
      }
    }
  });
}

function htmlEntities(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rehtmlEntities(str) {
  return String(str)
    .replace("&amp;", "&")
    .replace("&lt;", "<")
    .replace("&gt;", ">")
    .replace("&quot;", '"');
}

function href_question(function_name, question) {
  vex.dialog.open({
    message: question,
    buttons: [
      $.extend({}, vex.dialog.buttons.YES, { text: "Tak" }),
      $.extend({}, vex.dialog.buttons.NO, { text: "Nie" })
    ],
    callback: function(data) {
      if (data) {
        window[function_name]();
      }
    }
  });
}

function form_question(form_id, question, event) {
  if (event != null) {
    event.preventDefault();
    event.stopPropagation();
  }

  vex.dialog.open({
    message: question,
    buttons: [
      $.extend({}, vex.dialog.buttons.YES, { text: "Tak" }),
      $.extend({}, vex.dialog.buttons.NO, { text: "Nie" })
    ],
    callback: function(data) {
      if (data) $("#" + form_id).submit();
    }
  });
}

function gameAlert(text, callback) {
  vex.dialog.open({
    message: text,
    buttons: [$.extend({}, vex.dialog.buttons.YES, { text: "OK" })],
    callback: function(_data) {
      if (typeof callback === "function") callback();
    }
  });
}

function load_plecak(cat, format) {
  $.ajax({
    url: "/ajax",
    data: { method: "plecak", func: "get_items", cat: cat, format: format },
    type: "post",
    success: function(output) {
      $("#item_" + cat + "_container").html(output);
    }
  });
}

function load_pokesklep(cat, format) {
  $.ajax({
    url: "/ajax",
    data: { method: "pokesklep", func: "get_items", cat: cat, format: format },
    type: "post",
    success: function(output) {
      $("#item_" + cat + "_container").html(output);
    }
  });
}

function show_info_window(type, id) {
  $("#info_window").remove();

  $.ajax({
    url: "/ajax",
    data: { method: "info_window", func: type, id: id },
    type: "post",
    success: function(output) {
      if (output.length > 0) $("body").append(output);
    }
  });
}

function show_info_window(type, id, id2) {
  $("#info_window").remove();

  $.ajax({
    url: "/ajax",
    data: { method: "info_window", func: type, id: id, id2: id2 },
    type: "post",
    success: function(output) {
      if (output.length > 0) $("body").append(output);
    }
  });
}

function close_info_window() {
  $("#info_window").remove();
}

//zarządzanie graczami na chacie

function chat_user_menager(id) {
  vex.dialog.open({
    message: "Co chcesz zrobić?",
    buttons: [
      $.extend({}, vex.dialog.buttons.NO, {
        className: "vex-dialog-button-primary",
        text: "Wyślij ostrzeżenie",
        click: function($vexContent, _event) {
          $vexContent.data().vex.value = "send_warning";
          vex.close($vexContent.data().vex.id);
        }
      })
      /*
            $.extend({}, vex.dialog.buttons.NO, { className: 'vex-dialog-button-primary', text: 'Zablokuj', click: function($vexContent, event) {
	            $vexContent.data().vex.value = 'ban_chat';
	            vex.close($vexContent.data().vex.id);
	        }}),*/
    ],
    callback: function(data) {
      switch (data) {
        case "send_warning":
          show_warning_prompt(id);
          break;
        case "ban_chat":
          show_ban_prompt(id);
          break;
      }
    }
  });
}

function changePanelTab(tab_name, update_content) {
  const log = createLog('changePanelTab');

  return new Promise((resolve, reject) => {
    $.ajax({
      url: "/ajax_panel",
      data: {
        method: "load_tab",
        tab_name: tab_name,
        update_content: update_content ? 1 : 0
      },
      type: "post",
      success: function(output) {
        stop_time_quest_interval();

        if (output.trim() != "") $("#info_col").html(output);

        if (output.trim() != "" || update_content == false) {
          $(".panel_tab_box .panel_tab").removeClass("active");
          $(".panel_tab_box .panel_tab." + tab_name + "_icon").addClass("active");
        }

        resolve([{ success: true, log: log.consume() }]);
      },
      error: function(error) {
        log.push(String(error));
        reject([{ success: false, log: log.consume() }]);
      }
    });
  });
}

function setPanelEventQuest(quest_num) {
  $.ajax({
    url: "/ajax_panel",
    data: { method: "set_event_quest", quest_num: quest_num },
    type: "post",
    success: function(output) {
      if (output == 1) changePanelTab("event", true);
    }
  });
}

function resetPanelLocationDrop() {
  $.ajax({
    url: "/ajax_panel",
    data: { method: "reset_location_drop" },
    type: "post",
    success: function(output) {
      if (output == 1) changePanelTab("catch", true);
    }
  });
}

function changeCurrentDailyAction(action_name) {
  $.ajax({
    url: "/ajax_panel",
    data: { method: "change_current_daily_action", action_name: action_name },
    type: "post",
    success: function(output) {
      if (output == 1) {
        changePanelTab("daily", true);
      }
    }
  });
}

function show_warning_prompt(id) {
  vex.dialog.prompt({
    message: "Wpisz treść ostrzeżenia",

    placeholder: "Treść",
    callback: function(value) {
      if (value == false) return;
      console.log(value);
      $.ajax({
        url: "/ajax",
        data: {
          method: "chat_admin",
          func: "send_warning",
          user_id: id,
          message: value
        },
        type: "post"
      });
    }
  });
}

function dont_share(id) {
  $.ajax({
    url: "/ajax",
    data: { method: "team_poke", func: "dont_share", id: id },
    type: "post",
    success: function(output) {
      if (output.trim() != "") {
        showInfo(3, output);
      } else {
        team_get_poke_list("shared", null, null);
      }
    }
  });
}

function osada_bld(dzialanie, x, y) {
  $.ajax({
    url: "/stowarzyszenie/twoje/osada/?" + dzialanie + "&x=" + x + "&y=" + y,
    data: { only_content: true },
    type: "post",
    success: function(output) {
      $("#content").html(output);
    }
  });
}

function profil_pelna_lista_gablotek(id) {
  $.ajax({
    url: "/ajax",
    data: { method: "lista_gablotek", id: id },
    type: "post",
    success: function(output) {
      $(".profile_region_progress_box").prepend(output);
      $(".profile_region_full_box").fadeIn();
    }
  });
}

function start_time_quest_interval() {
  stop_time_quest_interval();
  time_quest_interval = setInterval(refresh_time_quest, 1000);
}

function stop_time_quest_interval() {
  clearInterval(time_quest_interval);
}

function start_assoc_quest_interval() {
  stop_assoc_quest_interval();
  assoc_quest_interval = setInterval(refresh_time_assoc_quest, 1000);
}

function stop_assoc_quest_interval() {
  clearInterval(assoc_quest_interval);
}

function refresh_time_assoc_quest() {
  var time = $("#assoc-quest-left-time")
    .text()
    .split(":");

  var hours = parseInt(time[0]);
  var minutes = parseInt(time[1]);
  var seconds = parseInt(time[2]);

  seconds--;
  if (seconds < 0) {
    seconds = 59;

    minutes--;
    if (minutes < 0) {
      minutes = 59;

      hours--;
      if (hours < 0) {
        setAssocQuestTime(0, 0, 0);
        stop_assoc_quest_interval();
        return;
      }
    }
  }

  setAssocQuestTime(hours, minutes, seconds);
}

function setAssocQuestTime(hours, minutes, seconds) {
  if (seconds < 10 && seconds >= 0) {
    seconds = "0" + seconds;
  }

  if (minutes < 10 && minutes >= 0) {
    minutes = "0" + minutes;
  }

  var text = hours + ":" + minutes + ":" + seconds;

  $("#assoc-quest-left-time").text(text);
}

function refresh_time_quest() {
  $.ajax({
    url: "/time_quest",
    data: { method: "get_view" },
    type: "post",
    success: function(output) {
      $(".time-quest").html(output);
    }
  });
}
