from netCDF4 import *
import os.path

main_dir = '/Users/Student/Documents/SPT_Global/ERA-Jared/'
Watershed = 'Nepal-Bagmati'
file = 'Qout_erai_t511_24hr_19800101to20141231.nc'

ERA_file = os.path.join(main_dir+Watershed,file)

ERA_dataset = Dataset(ERA_file)
Q_out = ERA_dataset.variables[Qout][:]
print (Q_out)
