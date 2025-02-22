<?php

use MediaWiki\MediaWikiServices;
use MediaWiki\Api\ApiBase;


class ApiToDoList extends ApiBase {

	public function execute() {

		$params = $this->extractRequestParams();
		$description = ApiToDoList::updateCheckboxState( $params['index'], $params['isChecked'] );


		$this->getResult()->addValue( null, "description", $description );
	}


	private static function updateCheckboxState( $query ) {
				
	}

}
