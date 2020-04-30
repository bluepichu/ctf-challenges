<?php
session_start();

function flash($severity, $content) {
	$_SESSION["flash"][] = array("severity" => $severity, "content" => $content);
}
