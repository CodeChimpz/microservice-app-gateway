import {EtcdRegistry} from 'mein-etcd-service-registry';
import {config} from "dotenv";
config()
export const registry = new EtcdRegistry.ServiceRegistry({
    // auth: {
    //     username: String(process.env.ETCD_USER),
    //     password: String(process.env.ETCD_PASS),
    // },
    hosts: String(process.env.ETCD_HOST)
})