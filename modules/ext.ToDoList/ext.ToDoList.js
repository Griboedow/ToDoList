function changeNthCheckboxState(content, index, desiredStatus) {
    let counter = 0;
    return content.replace(/<todo(?:\s+done="(true|false)")?\s*\/>/g, function(match) {
        counter++;
        if (counter === index) {
            return desiredStatus ? '<todo done="true"/>' : '<todo/>';
        }
        return match;
    });
}

//queue is needed to avoid at least local conflicts
var toDoModificationQueue = Promise.resolve();


( function ( mw, $ ) {



	$( ".todo-checkbox" ).each( function( index, element ) {
		element.todoIndex = index + 1; //start from 1
		
		element.addEventListener('click', function(e) {
			e.preventDefault();
			document.body.style.cursor = "wait";

			toDoModificationQueue = toDoModificationQueue.then(new mw.Api().edit(
				mw.config.get('wgTitle'),
				function ( revision ) {
					return {
						text: changeNthCheckboxState(revision.content, element.todoIndex, !element.checked),
						summary: 'Checkbox click (set checkbox #' + element.todoIndex + ' to ' + (element.checked ? 'checked' : 'unchecked') + ')',
						minor: true
					};
				}
			)
			.then( function () {
				element.checked = !element.checked;
				
				document.body.style.cursor = "";

				//Maybe it is better to refresh it?
				//window.location.reload();
			} ));

			
		})
		
	});
}( mediaWiki, jQuery ) );
