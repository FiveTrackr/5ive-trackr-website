/**
 * 5ive Trackr Digital Watermarking System
 * This file contains code to embed and verify digital watermarks
 * within the application to prove ownership and detect copying.
 */

// Self-executing function for encapsulation
(function() {
    // Create unique encoding function for watermarks
    function encodeWatermark(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += ('00' + charCode.toString(16)).slice(-2);
        }
        return result;
    }
    
    // Decode a watermark
    function decodeWatermark(encoded, key) {
        let result = '';
        for (let i = 0; i < encoded.length; i += 2) {
            const hexPair = encoded.substring(i, i + 2);
            const charCode = parseInt(hexPair, 16) ^ key.charCodeAt((i/2) % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    }
    
    // Define watermark data
    const watermarkData = {
        author: "5ive Trackr",
        created: "2025-07-15",
        version: "1.0.0",
        copyright: "© 2025 5ive Trackr. All rights reserved.",
        license: "Proprietary - Unauthorized use is prohibited"
    };
    
    // Create a secret key for encoding
    const secretKey = "5T" + navigator.userAgent.replace(/\D/g, '').substring(0, 10);
    
    // Encode the watermark
    const encodedWatermark = encodeWatermark(JSON.stringify(watermarkData), secretKey);
    
    // Embed watermark in various places
    function embedWatermarks() {
        // 1. Embed in HTML comments
        embedHtmlCommentWatermark();
        
        // 2. Embed in CSS
        embedCssWatermark();
        
        // 3. Embed in JavaScript variables
        embedJsWatermark();
        
        // 4. Embed in local storage (encoded)
        localStorage.setItem('_5t_data', encodedWatermark);
    }
    
    // Embed watermark in HTML comments
    function embedHtmlCommentWatermark() {
        const watermarkComment = document.createComment(' 5ive Trackr Watermark: ' + encodedWatermark.substring(0, 32) + '... ');
        document.documentElement.appendChild(watermarkComment);
        
        // Also add an invisible div with data attributes
        const watermarkDiv = document.createElement('div');
        watermarkDiv.style.display = 'none';
        watermarkDiv.dataset.app = '5iveTrackr';
        watermarkDiv.dataset.wm = encodedWatermark.substring(32, 64);
        document.body.appendChild(watermarkDiv);
    }
    
    // Embed watermark in CSS
    function embedCssWatermark() {
        // Create a style element with watermark in a comment
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            /* 
             * 5ive Trackr Watermark: ${encodedWatermark.substring(64, 96)}...
             */
            body::after {
                content: "";
                position: absolute;
                z-index: -9999;
                opacity: 0;
                pointer-events: none;
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    // Embed watermark in JavaScript
    function embedJsWatermark() {
        // Create a hidden property on the window object with partial watermark
        Object.defineProperty(window, '_5t_wm', {
            value: encodedWatermark.substring(96, 128),
            writable: false,
            enumerable: false // Make it non-enumerable so it doesn't show up in for...in loops
        });
    }
    
    // Verify watermarks are intact
    function verifyWatermarks() {
        let foundWatermarks = 0;
        let validWatermarks = 0;
        
        // Check HTML comment watermark
        const htmlComments = getHtmlComments(document.documentElement);
        for (const comment of htmlComments) {
            if (comment.indexOf('5ive Trackr Watermark:') !== -1) {
                foundWatermarks++;
                // Extract watermark and verify
                const wmPart = comment.split('5ive Trackr Watermark:')[1].trim().split('...')[0].trim();
                if (wmPart === encodedWatermark.substring(0, 32)) {
                    validWatermarks++;
                }
            }
        }
        
        // Check div watermark
        const wmDiv = document.querySelector('div[data-app="5iveTrackr"]');
        if (wmDiv) {
            foundWatermarks++;
            if (wmDiv.dataset.wm === encodedWatermark.substring(32, 64)) {
                validWatermarks++;
            }
        }
        
        // Check CSS watermark - this one is harder to verify directly
        const styleElements = document.querySelectorAll('style');
        for (const style of styleElements) {
            if (style.textContent.indexOf('5ive Trackr Watermark:') !== -1) {
                foundWatermarks++;
                // Extract watermark and verify
                const match = style.textContent.match(/5ive Trackr Watermark: ([a-f0-9]+)\.\.\./);
                if (match && match[1] === encodedWatermark.substring(64, 96)) {
                    validWatermarks++;
                }
            }
        }
        
        // Check JavaScript watermark
        if (window._5t_wm) {
            foundWatermarks++;
            if (window._5t_wm === encodedWatermark.substring(96, 128)) {
                validWatermarks++;
            }
        }
        
        // Check localStorage watermark
        const lsWatermark = localStorage.getItem('_5t_data');
        if (lsWatermark) {
            foundWatermarks++;
            if (lsWatermark === encodedWatermark) {
                validWatermarks++;
            }
        }
        
        return {
            found: foundWatermarks,
            valid: validWatermarks,
            intact: validWatermarks === foundWatermarks && foundWatermarks > 0,
            confidence: foundWatermarks > 0 ? (validWatermarks / foundWatermarks) * 100 : 0
        };
    }
    
    // Helper function to get HTML comments
    function getHtmlComments(element) {
        const comments = [];
        const iterator = document.createNodeIterator(
            element,
            NodeFilter.SHOW_COMMENT,
            { acceptNode: function() { return NodeFilter.FILTER_ACCEPT; } }
        );
        
        let currentNode;
        while (currentNode = iterator.nextNode()) {
            comments.push(currentNode.textContent);
        }
        
        return comments;
    }
    
    // Expose watermarking API
    window.FiveTrackrWatermark = {
        // Check if watermarks are intact
        verify: function() {
            return verifyWatermarks();
        },
        
        // Get watermark information
        getInfo: function() {
            try {
                // Try to decode the watermark
                const encoded = localStorage.getItem('_5t_data');
                if (!encoded) return null;
                
                const decoded = decodeWatermark(encoded, secretKey);
                const data = JSON.parse(decoded);
                
                // Only show safe properties
                return {
                    author: data.author,
                    created: data.created,
                    version: data.version,
                    copyright: data.copyright
                };
            } catch (e) {
                return null;
            }
        },
        
        // Verify if this is an original or copied app
        isOriginal: function() {
            const verification = verifyWatermarks();
            return verification.intact && verification.confidence > 80;
        }
    };
    
    // Embed watermarks when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(embedWatermarks, 500);
    });
})();
