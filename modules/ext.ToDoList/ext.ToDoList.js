( function ( mw, $ ) {
	'use strict';

	var TODO_REGEX = /<todo(?:\s+done="(true|false)")?\s*(?:\/>|>\s*<\/todo>)/g;

	var PROTECTED_SECTION_PATTERNS = [
		/<!--[\s\S]*?-->/g,
		/<nowiki\s*>[\s\S]*?<\/nowiki\s*>/gi,
		/<nowiki\s*\/>/gi,
		/<pre\b[^>]*>[\s\S]*?<\/pre\s*>/gi,
		/<source\b[^>]*>[\s\S]*?<\/source\s*>/gi,
		/<syntaxhighlight\b[^>]*>[\s\S]*?<\/syntaxhighlight\s*>/gi,
		/<includeonly\s*>[\s\S]*?<\/includeonly\s*>/gi
	];

	/**
	 * Replace wikitext sections that may contain literal <todo> text
	 * (nowiki, comments, pre, etc.) with placeholders so the todo regex
	 * won't match them.
	 *
	 * @param {string} content Raw wikitext
	 * @return {{ cleaned: string, originals: string[] }}
	 */
	function shieldProtectedSections( content ) {
		var originals = [];
		PROTECTED_SECTION_PATTERNS.forEach( function ( pattern ) {
			content = content.replace( pattern, function ( match ) {
				var i = originals.length;
				originals.push( match );
				return '\x01TODOPROTECT_' + i + '\x01';
			} );
		} );
		return { cleaned: content, originals: originals };
	}

	/**
	 * Reverse of shieldProtectedSections — put original content back.
	 *
	 * @param {string} content Text with placeholders
	 * @param {string[]} originals Original strings from shieldProtectedSections
	 * @return {string}
	 */
	function unshieldProtectedSections( content, originals ) {
		return content.replace( /\x01TODOPROTECT_(\d+)\x01/g, function ( _, i ) {
			return originals[ parseInt( i, 10 ) ];
		} );
	}

	/**
	 * Count <todo> tags in wikitext, ignoring protected sections.
	 *
	 * @param {string} content Raw wikitext
	 * @return {number}
	 */
	function countTodoTags( content ) {
		var shielded = shieldProtectedSections( content );
		return ( shielded.cleaned.match( TODO_REGEX ) || [] ).length;
	}

	/**
	 * Toggle the Nth <todo> tag in wikitext (1-based), ignoring protected sections.
	 *
	 * @param {string} content Raw wikitext
	 * @param {number} index 1-based index of the tag to change
	 * @param {boolean} checked Desired checked state
	 * @return {string} Modified wikitext
	 */
	function toggleNthTodoTag( content, index, checked ) {
		var shielded = shieldProtectedSections( content );
		var counter = 0;
		var result = shielded.cleaned.replace( TODO_REGEX, function ( match ) {
			counter++;
			return ( counter === index )
				? ( checked ? '<todo done="true"/>' : '<todo/>' )
				: match;
		} );
		return unshieldProtectedSections( result, shielded.originals );
	}

	/**
	 * Query the current revision ID of a page.
	 *
	 * @param {mw.Api} api
	 * @param {string} pageName
	 * @return {jQuery.Promise<number>}
	 */
	function fetchCurrentRevId( api, pageName ) {
		return api.get( {
			action: 'query',
			prop: 'info',
			titles: pageName,
			formatversion: 2
		} ).then( function ( data ) {
			return data.query.pages[ 0 ].lastrevid;
		} );
	}

	// --- Initialization ---

	var pageName = mw.config.get( 'wgPageName' );
	var expectedCount = mw.config.get( 'wgToDoDirectCount' );
	var lastKnownRevId = mw.config.get( 'wgCurRevisionId' );
	var api = new mw.Api();
	var editQueue = $.Deferred().resolve().promise();
	var pendingSaves = 0;

	$( '.todo-checkbox' ).each( function ( _, element ) {
		var wrapper = element.closest( '[data-todo-index]' );
		if ( !wrapper ) {
			return;
		}
		var todoIndex = parseInt( wrapper.getAttribute( 'data-todo-index' ), 10 );

		element.addEventListener( 'click', function () {
			document.body.style.cursor = 'wait';
			pendingSaves++;

			editQueue = editQueue.then( function () {
				return fetchCurrentRevId( api, pageName ).then( function ( currentRevId ) {
					// Staleness: page was edited externally since our last known state
					if ( lastKnownRevId && currentRevId !== lastKnownRevId ) {
						mw.notify( 'Page was modified externally. Reloading to get the latest version.', {
							tag: 'todolist-stale',
							type: 'warn'
						} );
						setTimeout( function () { window.location.reload(); }, 1500 );
						return $.Deferred().reject( 'stale' ).promise();
					}

					return api.edit( pageName, function ( revision ) {
						// Guard: checkbox count changed (structure mismatch)
						if ( expectedCount !== null && countTodoTags( revision.content ) !== expectedCount ) {
							mw.notify( 'Checkbox layout changed. Reloading to avoid toggling the wrong item.', {
								tag: 'todolist-stale',
								type: 'warn'
							} );
							setTimeout( function () { window.location.reload(); }, 1500 );
							return $.Deferred().reject( 'count-mismatch' );
						}

						var checked = element.getElementsByTagName( 'input' )[ 0 ].checked;
						return {
							text: toggleNthTodoTag( revision.content, todoIndex, checked ),
							summary: 'Checkbox click (set checkbox #' + todoIndex + ' to ' + ( checked ? 'checked' : 'unchecked' ) + ')',
							minor: true
						};
					} );
				} ).then( function ( result ) {
					if ( result && result.newrevid ) {
						lastKnownRevId = result.newrevid;
					}
					pendingSaves--;
					if ( pendingSaves === 0 ) {
						mw.notify( 'All changes saved.', { tag: 'todolist-save', type: 'success', autoHideSeconds: 'short' } );
						document.body.style.cursor = '';
					}
				}, function ( code ) {
					pendingSaves--;
					if ( code !== 'stale' && code !== 'count-mismatch' ) {
						mw.notify( 'Failed to save checkbox #' + todoIndex + '.', { tag: 'todolist-save', type: 'error' } );
					}
					if ( pendingSaves === 0 ) {
						document.body.style.cursor = '';
					}
				} );
			} );
		} );
	} );
}( mediaWiki, jQuery ) );
