<?php
// ini_set('error_log','/Users/beatak/php_error.log');

require('constants.php');

// header('Content-type: text/plain');
header('Content-type: application/json');


$safe = array('tags', 'safe_search', 'has_geo', 'geo_context', 'lat', 'lon', 'radius', 'text');
if (0 < count($_GET)) {
  $passed = array();
  foreach($safe as $i => $key) {
    if (!empty($_GET[$key])) {
      $passed[$key] = $_GET[$key];
    }
  }
}

if (empty($passed)) {
  $params = 
    array(
          'api_key' => FLICKR_API_KEY
          ,'method' => 'flickr.photos.getRecent'
          ,'extras' => 'description,date_upload,owner_name,icon_server,original_format,tags,machine_tags,o_dims,views,media,url_sq,url_m,url_o'
          ,'format' => 'json'
          ,'nojsoncallback' => 1
          );
}
else {
$params = 
  array_merge(
              array(
                    'api_key' => FLICKR_API_KEY
                    ,'method' => 'flickr.photos.search'
                    ,'tag_mode' => 'all'
                    ,'extras' => 'description,date_upload,owner_name,icon_server,original_format,tags,machine_tags,o_dims,views,media,url_sq,url_m,url_o'
                    ,'format' => 'json'
                    ,'nojsoncallback' => 1
                    ),
              $passed
              );
}

/* print_r($passed); */
/* echo "\n====\n"; */
/* print_r($params); */

// error_log(print_r($params, true));

$encoded_params = array();
foreach ($params as $k => $v){
  $encoded_params[] = urlencode($k).'='.urlencode($v);
}
$url = 'http://api.flickr.com/services/rest/?' . implode('&', $encoded_params);

$rsp = file_get_contents($url);
echo $rsp;
