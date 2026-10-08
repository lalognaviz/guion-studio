export namespace store {
	
	export class ActoResumen {
	    id: number;
	    titulo: string;
	    orden: number;
	
	    static createFrom(source: any = {}) {
	        return new ActoResumen(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.titulo = source["titulo"];
	        this.orden = source["orden"];
	    }
	}
	export class ProyectoDetalle {
	    id: number;
	    titulo: string;
	    ruta_archivo?: string;
	    sinopsis: string;
	    actos: ActoResumen[];
	
	    static createFrom(source: any = {}) {
	        return new ProyectoDetalle(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.titulo = source["titulo"];
	        this.ruta_archivo = source["ruta_archivo"];
	        this.sinopsis = source["sinopsis"];
	        this.actos = this.convertValues(source["actos"], ActoResumen);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProyectoResumen {
	    id: number;
	    titulo: string;
	    ruta_archivo?: string;
	    creado_en: string;
	
	    static createFrom(source: any = {}) {
	        return new ProyectoResumen(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.titulo = source["titulo"];
	        this.ruta_archivo = source["ruta_archivo"];
	        this.creado_en = source["creado_en"];
	    }
	}

}

