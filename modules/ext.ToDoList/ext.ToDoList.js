function changeNthCheckboxState(content, index, desiredStatus) {
    let counter = 0;

	/* 
		Can we make it less stupid then to parse the whole wiki text?
		For sure, that is a bad approach: even simple "nowiki" will break the checklist order.
		But I have no idea how to identify each tag without overcomplicating things.
	*/
    return content.replace(/<todo(?:\s+done="(true|false)")?\s*\/>/g, function(match) {
        counter++;
        if (counter === index) {
            return desiredStatus ? '<todo done="true"/>' : '<todo/>';
        }
        return match;
    });
}

// Queue is needed to avoid at least "local" edit conflicts. Al edits are sequential, not parallel
var toDoModificationQueue = Promise.resolve();


( function ( mw, $ ) {
	$( ".todo-checkbox" ).each( function( index, element ) {
		element.todoIndex = index + 1; //start from 1 for natural order
		
		// Here we process checkbox click in "read" mode. "Edit" mode will not have this functionality for now.
		element.addEventListener('click', function(e) {			
			// Page modifiction takes some time. We will mark checkbox as checked after the process is finished. 
			//e.preventDefault();
			// use cursor style to identify loading is still in progress
			document.body.style.cursor = "wait";

			toDoModificationQueue = toDoModificationQueue.then(new mw.Api().edit(
				mw.config.get('wgTitle'),
				function ( revision ) {
					return {
						text: changeNthCheckboxState(revision.content, element.todoIndex, element.checked),
						summary: 'Checkbox click (set checkbox #' + element.todoIndex + ' to ' + (element.checked ? 'checked' : 'unchecked') + ')',
						minor: true
					};
				}
			)
			.then( function () {
				// Page edit is done, we can show it to user -- change state and cursor style
				//element.checked = !element.checked;
				document.body.style.cursor = "";

				/*
				** Maybe it is better to refresh it?
				** In case someone else modified the page and the checkbox order is different now.
				*/
				// window.location.reload();
			} ));

			
		})
		
	});
}( mediaWiki, jQuery ) );
