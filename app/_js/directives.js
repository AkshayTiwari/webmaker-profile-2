angular.module('wmProfile.directives', [])
  .directive('ngClick', function () {
    // Prevent default on all elements that have ngClick defined
    return {
      restrict: 'A',
      link: function (scope, el, attrs) {
        if (attrs.href === '#') {
          el.on('click', function (e) {
            e.preventDefault();
          });
        }
      }
    };
  })
  .directive('wmpLogin', ['WebmakerAuthClient', 'loginService',
    function (WebmakerAuthClient, loginService) {
      return {
        restrict: 'E',
        scope: false,
        templateUrl: '/user/_partials/login.html',
        link: function ($scope, el, attrs) {
          $scope.userInfo = loginService.getData();
          $scope.userLoggedIn = !!$scope.userInfo; // No user info means not logged in

          $scope.$on('userLoggedIn', function (event, data) {
            $scope.userLoggedIn = true;
            $scope.userInfo = data;
            $scope.$digest();
          });

          $scope.$on('userLoggedOut', function (event, data) {
            $scope.userLoggedIn = false;
            $scope.userInfo = undefined;
            $scope.$digest();
          });

          $scope.login = loginService.auth.login;
          $scope.logout = loginService.auth.logout;
        }
      };
    }
  ])
  .directive('selectize', function () {
    return {
      restrict: 'A',
      link: function ($scope, $element) {
        var options = [];

        for (var i = 0; i <= 0; i++) {
          // TODO: This can be done only after localization for profile is completed [1] Uncomment line below [2] Don't hard code id and title
          // var title = config.langmap[config.supported_languages[i]] ? config.langmap[config.supported_languages[i]].nativeName : 'unknown';
          options.push({
            id: 'en-US',
            title: 'English (United States)'
          });
        }

        $element.selectize({
          options: options,
          labelField: 'title',
          valueField: 'id'
        });
        var selectize = $element[0].selectize;
        selectize.setValue('en-US');
      }
    };
  })
  .directive('wmpToggleGroup', ['jQuery',
    // Put an "active" class on only the last clicked element in a group
    function ($) {
      return {
        restrict: 'A',
        link: function ($scope, el, attrs) {
          var elTriggers = $(el).children();

          elTriggers.on('click', function (event) {
            // Set active class only on current button choice
            elTriggers.filter('.active').removeClass('active');
            $(this).addClass('active');
          });
        }
      };
    }
  ])
  .directive('wmpActivateChild', ['jQuery',
    // Put "active" class on child based on starting URL
    function ($) {
      return {
        restrict: 'AE',
        link: function ($scope, el, attrs, controller) {
          var elChildren = $(el).children();
          var urlView = window.location.pathname.match(/\/([^\/]+)\/?$/)[1];
          var viewMatched = false;

          for (var i = 0, ii = elChildren.length; i < ii; i += 1) {
            var linkedView = elChildren.eq(i).attr('href').match(/\/([^\/]+)\/?$/)[1];

            if (linkedView === urlView) {
              elChildren.eq(i).addClass('active');
              viewMatched = true;
              break;
            }
          }

          if (!viewMatched) {
            elChildren.eq(0).addClass('active');
          }
        }
      };
    }
  ])
  .directive('wmpSortFilterBar', ['jQuery',
    // Pull in sorting and filtering commands from a button group and put choices on scope
    function ($) {
      return {
        restrict: 'AE',
        link: function (scope, el, attrs) {
          var elTriggers = $(el).children();

          elTriggers.on('click', function (event) {
            if ($(this).data('content-filter')) {
              scope.filterBy = {
                contentType: 'application/x-' + $(this).data('content-filter')
              };
            } else {
              delete scope.filterBy;
            }

            if ($(this).data('sort-id')) {
              scope.sortOrder = $(this).data('sort-id');
            } else {
              delete scope.sortOrder;
            }

            scope.$apply();
          });
        }
      };
    }
  ])
  .directive('wmpMakesList', function () {
    return {
      restrict: 'E',
      scope: false,
      templateUrl: '/user/_partials/makes-list.html'
    };
  })
  .directive('wmpLinkCollector', ['jQuery',
    function ($) {
      return {
        restrict: 'AE',
        scope: {
          isEditMode: '=wmpEditMode',
          links: '=ngModel'
        },
        templateUrl: '/user/_partials/link-collector.html',
        link: function ($scope, el, attrs, controller) {
          var elWrapper = $(el),
            elInput = elWrapper.find('.link-form input');

          $scope.links = $scope.links || [];

          // An array of objects with service names for custom rendering
          $scope.annotatedlinks = [];

          $scope.showInvalid = false;
          $scope.showDuplicate = false;

          function getServiceFromURL(targetURL) {
            var title = targetURL.split('//')[1];

            // Each key corresponds to a Font Awesome classname (minus "fa-")
            var serviceRegexes = {
              'twitter': /^(?:www.)?twitter\.com\//,
              'tumblr': /^[a-zA-Z]*\.tumblr\.com/,
              'facebook-square': /^(?:www.)?facebook\.com\/[^\/\n]*$/m,
              'google-plus': /^plus\.google\.com\//,
              'vimeo-square': /vimeo\.com\/[a-zA-Z]/,
              'github-alt': /^github\.com\/[^\/\n]*$/m,
              'dribbble': /^dribbble\.com\/[^\/\n]*$/m,
              'pinterest': /^(?:www.)?pinterest\.com\/[^\/]*(?:\/)?$/m
            };

            // Attempt to match URL to a service
            for (var service in serviceRegexes) {
              if (title.match(serviceRegexes[service])) {
                return service;
              }
            }

            // If the URL doesn't match common social services, just use it verbatim
            return null;
          }

          function validateURL(url) {
            // Don't allow empty or null strings
            if (!url || url.trim() === '') {
              return false;
            }

            // If no protocol is set, assume http and prepend it
            if (!url.match(/https?:\/\//)) {
              url = 'http://' + url;
            }

            // Don't allow duplicate URLs
            if ($scope.links.length) {
              for (var i = $scope.links.length - 1; i >= 0; i--) {
                if (url === $scope.links[i]) {
                  $scope.showDuplicate = true;
                  return false;
                }
              }

              $scope.showDuplicate = false;
            }

            return url;
          }

          $scope.addLink = function (url) {
            url = validateURL(url);

            if (url) {
              $scope.links.push(url);
              return true;
            } else {
              return false;
            }
          };

          // Clear the input when a link is added
          $scope.addLinkUI = function (url) {
            if ($scope.addLink(url)) {
              elInput.val(null);
            }
          };

          $scope.removeLinkUI = function (index) {
            $scope.links.splice(index, 1);
          };

          function updateUI(links) {
            $scope.annotatedlinks = [];

            for (var index = 0, length = links.length; index < length; index++) {
              $scope.annotatedlinks.push({
                url: links[index],
                service: getServiceFromURL(links[index])
              });
            }
          }

          // EVENT DELEGATION -------------------------------------------------

          // Add links when enter is pressed
          elInput.on('keypress', function (event) {
            if (event.keyCode === 13) {
              event.preventDefault();
              $scope.addLinkUI($scope.userLink);
              $scope.$apply();
            }
          });

          // All UI link list changes are driven by changes to the links model
          $scope.$watch('links', function (newValue) {
            if (newValue) {
              updateUI(newValue);
            }
          }, true);
        }
      };
    }
  ]);
