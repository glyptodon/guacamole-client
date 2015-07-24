/*
 * Copyright (C) 2015 Glyptodon LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * The configuration block for setting up everything having to do with i18n.
 */
angular.module('index').config(['$injector', function($injector) {

    // Required providers
    var $translateProvider        = $injector.get('$translateProvider');
    var preferenceServiceProvider = $injector.get('preferenceServiceProvider');

    // Fallback to US English
    $translateProvider.fallbackLanguage('en');

    // Prefer chosen language
    $translateProvider.preferredLanguage(preferenceServiceProvider.preferences.language);

    // Escape any HTML in translation strings
    $translateProvider.useSanitizeValueStrategy('escape');

    // Load translations via translationLoader service
    $translateProvider.useLoader('translationLoader');

    // Provide pluralization, etc. via messageformat.js
    $translateProvider.useMessageFormatInterpolation();

}]);
