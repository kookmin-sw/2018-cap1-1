from dotenv import load_dotenv, find_dotenv
import os

load_dotenv(find_dotenv())

class Config:

	# Configuration for Google Secret
	google = {
		"id" : os.environ.get("GOOGLE_ID"),
		"secret" : os.environ.get("GOOGLE_SECRET"),
	}

	# Configuration for upload folder
	upload_folder = os.environ.get("UPLOAD_FOLDER")

	# Configuration for hash password
	hash_password = os.environ.get("HASH_PASSWORD")

	# Configuration for loader path
	loader_path = os.environ.get("LOADER_PATH")