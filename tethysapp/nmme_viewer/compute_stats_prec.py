import netCDF4 as nc
from netCDF4 import *
from pylab import *
import gdal,gdalconst
import os,os.path
import numpy as np
import glob
import re
import osr
import ogr




def get_netcdf_info(filename,var_name):
    nc_file = gdal.Open(filename)
    
    if nc_file is None:
        sys.exit()
    if nc_file.GetSubDatasets() > 1:
        subdataset = 'NETCDF:"' + filename + '":' + var_name  # Specifying the subset name
        src_ds_sd = gdal.Open(subdataset)  # Reading the subset
        # NDV = src_ds_sd.GetRasterBand(1).GetNoDataValue()  # Get the nodatavalues
        xsize = src_ds_sd.RasterXSize  # Get the X size
        ysize = src_ds_sd.RasterYSize  # Get the Y size
        GeoT = src_ds_sd.GetGeoTransform()  # Get the GeoTransform
        Projection = osr.SpatialReference()  # Get the SpatialReference
        Projection.ImportFromWkt(src_ds_sd.GetProjectionRef())  # Setting the Spatial Reference

        src_ds_sd = None  # Closing the file
        nc_file = None  # Closing the file

        return xsize, ysize, GeoT, Projection



main_dir = '/Users/Student/Documents/LIS/GEOS5/'
input_dir = '/Users/Student/Documents/LIS/198301/'




file_list = sorted(glob.glob('/Users/Student/Documents/LIS/GEOS5/ens1/*.nc'))
time_steps = []
for i in file_list:
	start = i.find('.monthly.')
	end = i.find('.nc', start)
	time_steps.append(i[start:end])

# print(file_list)

var = 'PRECTOT'

for i in (time_steps):
	current_ts = []
	for ens in sorted(os.listdir(main_dir)):
		file_path = os.path.join(main_dir,ens)
		forecast_file = os.path.join(file_path, '/Users/Student/Documents/LIS/GEOS5/' + ens + '/geosgcm_vis2d' + i + '.nc')
		forecast = Dataset(forecast_file, 'r', format='NETCDF4')
		xsize, ysize, GeoT, Projection = get_netcdf_info(forecast_file, var) #calls 'get_netcdf_info' function from above
		precip = forecast.variables[var][:] # Creates an array containing all the precip values in the file
		precip = precip[:,::-1]
		current_ts.append(precip) # adds the current time series precip values array to the array.
		
	mean,min,max = np.mean(current_ts, axis=(0,1),dtype=np.float64),np.amin(current_ts,axis=(0,1)),np.amax(current_ts,axis=(0,1)) #computes mean, min, max values for each lat, lon combination based on 7 ensembles
	
	if i.endswith('01.nc') or i.endswith('05.nc') or i.endswith('07.nc') or i.endswith('08.nc') or i.endswith('10.nc') or i.endswith('12.nc'): #Convert precip from kg-m/s to cm
		mean = mean*86400/10*31
		min = min*86400/10*31
		max = max*86400/10*31
	else:
		mean = mean*86400/10*30
		min = min*86400/10*30
		max = max*86400/10*30

	#Create Geotiffs from mean, min, and max arrays
	mean_dir = '/Users/Student/Documents/LIS/Forecast GTiffs/PRECTOT/Mean/'
	min_dir = '/Users/Student/Documents/LIS/Forecast GTiffs/PRECTOT/Min/'
	max_dir = '/Users/Student/Documents/LIS/Forecast GTiffs/PRECTOT/Max/'
	driver = gdal.GetDriverByName('GTiff')
	mean_DataSet = driver.Create(mean_dir + i[-6:] + '_PRECTOT_mean.tif',xsize,ysize, 1, gdal.GDT_Float32)
	mean_DataSet.SetGeoTransform(GeoT)
	srs = osr.SpatialReference()
	srs.ImportFromEPSG(4326)
	mean_DataSet.SetProjection(srs.ExportToWkt())

	mean_DataSet.GetRasterBand(1).WriteArray(mean)
	mean_DataSet.FlushCache()

	mean_DataSet = None

	min_DataSet = driver.Create(min_dir + i[-6:] + '_PRECTOT_min.tif',xsize,ysize, 1, gdal.GDT_Float32)
	min_DataSet.SetGeoTransform(GeoT)
	srs = osr.SpatialReference()
	srs.ImportFromEPSG(4326)
	min_DataSet.SetProjection(srs.ExportToWkt())

	min_DataSet.GetRasterBand(1).WriteArray(min)
	min_DataSet.FlushCache()

	min_DataSet = None

	max_DataSet = driver.Create(max_dir + i[-6:] + '_PRECTOT_max.tif',xsize,ysize, 1, gdal.GDT_Float32)
	max_DataSet.SetGeoTransform(GeoT)
	srs = osr.SpatialReference()
	srs.ImportFromEPSG(4326)
	max_DataSet.SetProjection(srs.ExportToWkt())

	max_DataSet.GetRasterBand(1).WriteArray(max)
	max_DataSet.FlushCache()

	max_DataSet = None





	








	

