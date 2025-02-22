<?php
use MediaWiki\Parser\Parser;

/**
 * Hooks used by ToDoList extension 
 */
class ToDoListHooks {
	
	/**
	 * We extend parser here.
	 * Parser will process our custom tag: <todo>
	 */
	public static function onParserSetup( Parser $parser ) {
		$parser->setHook( 'todo', 'ToDoListHooks::processToDoListTag' );
		return true;
	}


	/**
	 * Implementation of the '<todo>' tag processing
	 */
	public static function processToDoListTag( $input, array $args, Parser $parser, PPFrame $frame ) {
		$out = $parser->getOutput();
		$out->addModules( ['ext.ToDoList'] );

		$isDone = False;
		if( isset( $args['done'] ) ){
			$isDone =  filter_var($args['done'], FILTER_VALIDATE_BOOLEAN);
		}

		return '<input type="checkbox" class="todo-checkbox"' . ( $isDone ? ' checked' : '' ) . '>';
	}

}