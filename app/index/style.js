import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css/animate.min.css';
import 'typeface-roboto/index.css';
import 'paper-css/paper.min.css';

import jQuery from 'jquery';
import { WOW } from 'wowjs';
import 'jquery.easing';
import 'superfish';
import 'superfish/dist/js/hoverIntent';
import svgMenu from '../resource/icons/ic_menu_black_36px.svg';
import svgClose from '../resource/icons/ic_close_black_36px.svg';
import svgUp from '../resource/icons/ic_arrow_drop_up_black_36px.svg';
import svgDown from '../resource/icons/ic_arrow_drop_down_black_36px.svg';
import './typeface-noto-sans.css';
import './style.css';

/* eslint-disable func-names */

jQuery(document).ready(($) => {
  // Header fixed and Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
      $('#header').addClass('header-fixed');
    } else {
      $('.back-to-top').fadeOut('slow');
      $('#header').removeClass('header-fixed');
    }
  });
  $('.back-to-top').click(() => {
    $('html, body').animate({
      scrollTop: 0,
    }, 500, 'easeOutExpo');
    return false;
  });

  // Initiate the wowjs animation library
  new WOW().init();

  // Toggle faq
  $('a[data-toggle="collapse"]').click(function () {
    $(this).toggleClass('collapsed');
    $(this).next().toggleClass('show');
  });

  // Initiate superfish on nav menu
  $('.nav-menu').superfish({
    animation: {
      opacity: 'show',
    },
    delay: 400,
    speed: 50,
    speedOut: 'fast',
  });

  // Mobile Navigation
  if ($('#nav-menu-container').length) {
    const mobileNav = $('#nav-menu-container').clone().prop({
      id: 'mobile-nav',
    });
    mobileNav.find('> ul').attr({
      class: '',
    });
    mobileNav.find('ul').attr({
      id: '',
    });
    const mobileNavToggle = $('<button type="button" id="mobile-nav-toggle"></button>').append(svgMenu).append($(svgClose).toggle());
    $('body').append(mobileNav);
    $('body').prepend(mobileNavToggle);
    $('body').append('<div id="mobile-body-overly"></div>');
    $('#mobile-nav').find('.menu-has-children').prepend($(svgUp).toggle()).prepend(svgDown);

    $(document).on('click', '.menu-has-children > a', function () {
      $(this).toggleClass('menu-item-active');
      $(this).nextAll('ul').eq(0).slideToggle();
      $(this).parent().children('svg').toggle();
    });

    $(document).on('click', '.menu-has-children > svg', function () {
      $(this).parent().children('a').toggleClass('menu-item-active');
      $(this).nextAll('ul').eq(0).slideToggle();
      $(this).parent().children('svg').toggle();
    });

    $(document).on('click', '#mobile-nav-toggle', () => {
      $('body').toggleClass('mobile-nav-active');
      $('#mobile-nav-toggle svg').toggle();
      $('#mobile-body-overly').toggle();
    });

    $(document).click((e) => {
      const container = $('#mobile-nav, #mobile-nav-toggle');
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('#mobile-nav-toggle svg').toggle();
          $('#mobile-body-overly').fadeOut();
        }
      }
    });
  } else if ($('#mobile-nav, #mobile-nav-toggle').length) {
    $('#mobile-nav, #mobile-nav-toggle').hide();
  }

  // Close mobile nav on click
  $('#mobile-nav a').on('click', function () {
    const li = $(this).closest('li');
    const upli = li.parent().closest('li');
    if (!li.hasClass('menu-has-children')) {
      $('body').removeClass('mobile-nav-active');
      $('#mobile-nav-toggle svg').toggle();
      $('#mobile-body-overly').fadeOut();
    }
    if (upli.hasClass('menu-has-children')) {
      upli.children('a').toggleClass('menu-item-active');
      upli.children('ul').eq(0).slideToggle();
      upli.children('svg').toggle();
    }
  });

  // Smoth scroll on page hash links
  $('.nav-menu a, #mobile-nav a, .scrollto').on('click', function () {
    if (!this.hash) return undefined;

    const target = $(this.hash);
    if (!target.length) return undefined;

    let topSpace = 0;

    if ($('#header').length) {
      topSpace = $('#header').outerHeight();

      if (!$('#header').hasClass('header-fixed')) {
        topSpace -= 20;
      }
    }

    $('html, body').animate({
      scrollTop: target.offset().top - topSpace,
    }, 500, 'easeOutExpo');

    if ($(this).parents('.nav-menu').length) {
      $('.nav-menu .menu-active').removeClass('menu-active');
      $(this).closest('li').addClass('menu-active');
    }

    return false;
  });
});
