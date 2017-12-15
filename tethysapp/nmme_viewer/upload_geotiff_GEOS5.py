import os
import requests


def upload_tiff(dir, geoserver_rest_url, workspace, uname, pwd):

    headers = {
        'Content-type': 'image/tiff',
    }

    dir = os.path.join(dir,"")

    for file in sorted(os.listdir(dir)):  # Looping through all the files in the given directory
        if file is None:
            sys.exit()
        data = open(dir + file, 'rb').read()  # Read the file
        store_name = file.split("_")[0] # Creating the store name dynamically
        print(store_name)

        request_url = '{0}workspaces/{1}/coveragestores/{2}/file.geotiff'.format(geoserver_rest_url, workspace,
                                                                                 store_name)  # Creating the rest url
        print(request_url)

        requests.put(request_url, headers=headers, data=data,
                     auth=(uname, pwd))  # Creating the resource on the geoserver

dir = '/Users/Student/Documents/LIS/Forecast GTiffs/T2M/Max'
rest_url = 'http://localhost:8080/geoserver/rest/'
workspace = 'GEOS5_T2M_Max'
uname = 'admin'
pwd = 'geoserver'

upload_tiff(dir, rest_url, workspace, uname, pwd)

