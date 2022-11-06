print("creating rogue user");
db.createUser({
	user: "rogue",
	pwd: "clockbirddeskbearlimbo",
	roles: [{role: "readWrite", db: "blundertale"}]
});
print(db.system.users.find());
print("done");
